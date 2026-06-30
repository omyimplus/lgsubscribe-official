import sharp from 'sharp'

const FETCH_TIMEOUT_MS = 12_000
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

/** โหลดรูปสินค้าเป็น PNG buffer สำหรับ pdfkit */
export async function fetchProductImageForPdf(url: string | null | undefined): Promise<Buffer | null> {
  const raw = url?.trim()
  if (!raw) return null

  let target = raw
  if (target.startsWith('/')) {
    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl?.replace(/\/$/, '')
    const siteUrl = config.public.siteUrl?.replace(/\/$/, '')
    if (target.startsWith('/storage/') && supabaseUrl) {
      target = `${supabaseUrl}${target}`
    }
    else if (siteUrl) {
      target = `${siteUrl}${target}`
    }
    else {
      return null
    }
  }

  try {
    const response = await fetch(target, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: 'image/*' },
    })
    if (!response.ok) return null

    const bytes = Buffer.from(await response.arrayBuffer())
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return null

    const meta = await sharp(bytes).metadata()
    if (meta.format === 'jpeg' || meta.format === 'png') {
      return sharp(bytes)
        .resize({ width: 240, height: 180, fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer()
    }

    return sharp(bytes)
      .resize({ width: 240, height: 180, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer()
  }
  catch {
    return null
  }
}

export async function fetchProductImagesForPdf(
  urls: Array<string | null | undefined>,
): Promise<Array<Buffer | null>> {
  return Promise.all(urls.map(url => fetchProductImageForPdf(url)))
}
