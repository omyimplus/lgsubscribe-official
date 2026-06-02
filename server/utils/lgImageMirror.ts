import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { extractBestVideoUrlsFromHtml } from './lgMediaBlocks'
import { isLikelyProductImageUrl, normalizeLgAssetUrl } from './lgPdpImages'

const MAX_SIDE_PX = 1920
const PRIMARY_WEBP_QUALITY = 76
const FALLBACK_WEBP_QUALITY = 62
const MAX_OUTPUT_BYTES = 450 * 1024
const FETCH_TIMEOUT_MS = 15000
const VIDEO_FETCH_TIMEOUT_MS = 60000
const MAX_MIRROR_IMAGES = 14
const MAX_MIRROR_VIDEOS = 8
const MAX_VIDEO_BYTES = 25 * 1024 * 1024

type SupabaseAdmin = ReturnType<typeof useSupabaseAdmin>

type HtmlFields = {
  description: string | null
  key_features: string | null
  features: string | null
  specifications: string | null
  faq_html: string | null
}

function normalizeUrl(url: string | null | undefined) {
  return normalizeLgAssetUrl(url)
}

function extractImageUrlsFromHtml(html: string | null | undefined) {
  if (!html) return []
  const urls = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
    .map(m => normalizeUrl(m[1]))
  const posters = [...html.matchAll(/<video[^>]+poster=["']([^"']+)["']/gi)]
    .map(m => normalizeUrl(m[1]))
  return [...urls, ...posters].filter(Boolean)
}

function rewriteHtmlImageSources(html: string | null | undefined, urlMap: Map<string, string>) {
  if (!html) return null
  return html.replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (_m, prefix, src, suffix) => {
    const normalized = normalizeUrl(src)
    const mapped = urlMap.get(normalized) || urlMap.get(src) || src
    return `${prefix}${mapped}${suffix}`
  })
}

function extractVideoUrlsFromHtml(html: string | null | undefined) {
  return extractBestVideoUrlsFromHtml(html).map(normalizeUrl).filter(Boolean)
}

function rewriteHtmlVideoSources(html: string | null | undefined, urlMap: Map<string, string>) {
  if (!html) return null
  return html.replace(
    /(<(?:video|source)[^>]+src=["'])([^"']+)(["'])/gi,
    (_m, prefix, src, suffix) => {
      const normalized = normalizeUrl(src)
      const mapped = urlMap.get(normalized) || urlMap.get(src) || src
      return `${prefix}${mapped}${suffix}`
    },
  )
}

function videoExtensionFromUrl(url: string, contentType: string) {
  const fromPath = url.match(/\.(mp4|webm|mov)(?:\?|$)/i)?.[1]?.toLowerCase()
  if (fromPath && ['mp4', 'webm', 'mov'].includes(fromPath)) return fromPath
  if (contentType.includes('webm')) return 'webm'
  if (contentType.includes('quicktime')) return 'mov'
  return 'mp4'
}

function isLikelyVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(?:\?|$)/i.test(url) || url.includes('/video/') || url.includes('/dam/')
}

async function fetchWithTimeout(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS,
  referer = 'https://www.lg.com/th/',
) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        referer,
      },
    })
  }
  finally {
    clearTimeout(timer)
  }
}

async function optimizeImageToWebp(input: Buffer) {
  const base = sharp(input, { failOn: 'none' }).rotate()
  const metadata = await base.metadata()
  const shouldResize = (metadata.width ?? 0) > MAX_SIDE_PX || (metadata.height ?? 0) > MAX_SIDE_PX
  const resized = shouldResize
    ? base.resize({ width: MAX_SIDE_PX, height: MAX_SIDE_PX, fit: 'inside', withoutEnlargement: true })
    : base

  let output = await resized.webp({ quality: PRIMARY_WEBP_QUALITY, effort: 4 }).toBuffer()
  if (output.length > MAX_OUTPUT_BYTES) {
    output = await resized.webp({ quality: FALLBACK_WEBP_QUALITY, effort: 4 }).toBuffer()
  }
  return output
}

async function mirrorOneImageToSupabase(
  supabase: SupabaseAdmin,
  batchId: string,
  sku: string,
  sourceUrl: string,
  referer?: string,
) {
  const response = await fetchWithTimeout(sourceUrl, FETCH_TIMEOUT_MS, referer)
  if (!response.ok) throw new Error(`download failed ${response.status}`)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.startsWith('image/') && !/\.(jpe?g|png|webp)(\?|$)/i.test(sourceUrl)) {
    throw new Error(`not image (${contentType || 'unknown'})`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  const optimized = await optimizeImageToWebp(bytes)
  const hash = createHash('sha1').update(sourceUrl).digest('hex').slice(0, 14)
  const path = `lg-import/${batchId}/${sku.toLowerCase()}/${hash}.webp`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, optimized, {
      upsert: true,
      contentType: 'image/webp',
      cacheControl: '31536000',
    })

  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Mirror รูปจาก LG ไป Supabase แล้ว rewrite URL ใน image_urls + HTML field
 * - จำกัดจำนวนรูปต่อสินค้าเพื่อคุมค่าใช้จ่าย
 * - ถ้า mirror ไม่สำเร็จ จะ fallback URL เดิม
 */
export async function mirrorImportedProductImages(
  supabase: SupabaseAdmin,
  payload: {
    batchId: string
    sku: string
    imageUrls: string[]
    htmlFields: HtmlFields
    /** referer จากหน้า PDP — ลดโอกาส LG ปฏิเสธดาวน์โหลดรูป */
    referer?: string | null
  },
) {
  const referer = payload.referer?.trim() || 'https://www.lg.com/th/'
  const baseImageUrls = payload.imageUrls.map(normalizeUrl).filter(Boolean)
  const htmlImageUrls = [
    ...extractImageUrlsFromHtml(payload.htmlFields.description),
    ...extractImageUrlsFromHtml(payload.htmlFields.key_features),
    ...extractImageUrlsFromHtml(payload.htmlFields.features),
    ...extractImageUrlsFromHtml(payload.htmlFields.specifications),
    ...extractImageUrlsFromHtml(payload.htmlFields.faq_html),
  ]

  const unique = [...new Set([...baseImageUrls, ...htmlImageUrls])]
    .map(normalizeUrl)
    .filter(url => /^https?:\/\//i.test(url) && isLikelyProductImageUrl(url))
    .slice(0, MAX_MIRROR_IMAGES)

  const urlMap = new Map<string, string>()
  for (const sourceUrl of unique) {
    try {
      const mirrored = await mirrorOneImageToSupabase(
        supabase,
        payload.batchId,
        payload.sku,
        sourceUrl,
        referer,
      )
      urlMap.set(sourceUrl, mirrored)
    }
    catch (err) {
      console.warn('[lgImageMirror] fallback original image:', sourceUrl, err)
    }
  }

  const mappedImageUrls = baseImageUrls
    .map(url => urlMap.get(url) || url)
    .filter(Boolean)
  const deduped = [...new Set(mappedImageUrls)]

  return {
    image_urls: deduped,
    image_url: deduped[0] ?? null,
    description: rewriteHtmlImageSources(payload.htmlFields.description, urlMap),
    key_features: rewriteHtmlImageSources(payload.htmlFields.key_features, urlMap),
    features: rewriteHtmlImageSources(payload.htmlFields.features, urlMap),
    specifications: rewriteHtmlImageSources(payload.htmlFields.specifications, urlMap),
    faq_html: rewriteHtmlImageSources(payload.htmlFields.faq_html, urlMap),
  }
}

async function mirrorOneVideoToSupabase(
  supabase: SupabaseAdmin,
  batchId: string,
  sku: string,
  sourceUrl: string,
) {
  const response = await fetchWithTimeout(sourceUrl, VIDEO_FETCH_TIMEOUT_MS)
  if (!response.ok) throw new Error(`download failed ${response.status}`)

  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  if (!contentType.startsWith('video/') && !isLikelyVideoUrl(sourceUrl)) {
    throw new Error('not video')
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > MAX_VIDEO_BYTES) throw new Error('video too large')

  const ext = videoExtensionFromUrl(sourceUrl, contentType)
  const hash = createHash('sha1').update(sourceUrl).digest('hex').slice(0, 14)
  const path = `lg-import/${batchId}/${sku.toLowerCase()}/videos/${hash}.${ext}`
  const uploadType = contentType.startsWith('video/')
    ? contentType.split(';')[0]
    : `video/${ext === 'mov' ? 'quicktime' : ext}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, bytes, {
      upsert: true,
      contentType: uploadType,
      cacheControl: '31536000',
    })

  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Mirror วิดีโอจาก LG (<video>/<source>) ไป Supabase แล้ว rewrite src ใน HTML
 * - จำกัดจำนวนและขนาดต่อสินค้า (สูงสุด 25MB/ไฟล์)
 * - ถ้า mirror ไม่สำเร็จ จะ fallback URL เดิม
 */
export async function mirrorImportedProductVideos(
  supabase: SupabaseAdmin,
  payload: {
    batchId: string
    sku: string
    htmlFields: HtmlFields
  },
) {
  const htmlVideoUrls = [
    ...extractVideoUrlsFromHtml(payload.htmlFields.description),
    ...extractVideoUrlsFromHtml(payload.htmlFields.key_features),
    ...extractVideoUrlsFromHtml(payload.htmlFields.features),
    ...extractVideoUrlsFromHtml(payload.htmlFields.specifications),
    ...extractVideoUrlsFromHtml(payload.htmlFields.faq_html),
  ]

  const unique = [...new Set(htmlVideoUrls)]
    .filter(url => /^https?:\/\//i.test(url) && isLikelyVideoUrl(url))
    .slice(0, MAX_MIRROR_VIDEOS)

  const urlMap = new Map<string, string>()
  for (const sourceUrl of unique) {
    try {
      const mirrored = await mirrorOneVideoToSupabase(
        supabase,
        payload.batchId,
        payload.sku,
        sourceUrl,
      )
      urlMap.set(sourceUrl, mirrored)
    }
    catch (err) {
      console.warn('[lgImageMirror] fallback original video:', sourceUrl, err)
    }
  }

  const rewrite = (html: string | null) => rewriteHtmlVideoSources(html, urlMap)

  return {
    description: rewrite(payload.htmlFields.description),
    key_features: rewrite(payload.htmlFields.key_features),
    features: rewrite(payload.htmlFields.features),
    specifications: rewrite(payload.htmlFields.specifications),
    faq_html: rewrite(payload.htmlFields.faq_html),
    mirroredVideoCount: urlMap.size,
  }
}
