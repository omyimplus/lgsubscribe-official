const LG_ORIGIN = 'https://www.lg.com'

const SKIP_URL_RE =
  /(?:logo|icon-|payment-icons|placeholder|loading\.gif|\/promotion\/|(?:^|\/)gnb[-/]|-gnb-|\/icons\/|\.svg(?:\?|$))/i

const PRODUCT_PATH_RE =
  /(?:\/gallery\/|gallery-|\/product|\/basic\/|\/hero\/|\/thumbnail\/|\/th\/images\/|\/w_\d|\/h_\d)/i

export function normalizeLgAssetUrl(url: string | null | undefined) {
  const raw = String(url ?? '').trim()
  if (!raw || raw.startsWith('data:')) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw.replace(/\/$/, '')
  if (raw.startsWith('//')) return `https:${raw}`.replace(/\/$/, '')
  if (raw.startsWith('/')) return `${LG_ORIGIN}${raw}`.replace(/\/$/, '')
  return `${LG_ORIGIN}/${raw}`.replace(/\/$/, '')
}

export function isLikelyProductImageUrl(url: string) {
  if (!url || !/^https?:\/\//i.test(url)) return false
  if (!/\.(jpe?g|png|webp)(?:\?|$|\/jcr)/i.test(url)) return false
  if (SKIP_URL_RE.test(url)) return false
  if (url.includes('lge.com') && !url.includes('/content/dam/channel/wcms/')) return false
  if (PRODUCT_PATH_RE.test(url)) return true
  if (url.includes('/content/dam/channel/wcms/th/image-update/')) return true
  return false
}

function imagePriority(url: string) {
  let score = 0
  if (url.includes('/gallery/') || url.includes('gallery-')) score += 40
  if (url.includes('product-front') || url.includes('/basic/')) score += 30
  if (url.includes('/renditions/') && url.includes('1600')) score += 25
  if (url.includes('/thumbnail/')) score -= 15
  if (url.includes('thum-')) score += 10
  if (url.includes('/promotion/')) score -= 100
  return score
}

function dedupeUrls(urls: string[]) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const url of urls) {
    const key = url.replace(/\/jcr:content\/renditions\/[^/]+$/i, '').toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(url)
  }
  return out
}

/** ดึงรูปสินค้าจาก HTML หน้า PDP /lgsubscribe */
export function extractPdpImageUrls(
  html: string,
  options?: { limit?: number },
) {
  const limit = options?.limit ?? 20
  const candidates: string[] = []

  const og
    = html.match(/<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i)
  if (og?.[1]) candidates.push(normalizeLgAssetUrl(og[1]))

  for (const m of html.matchAll(
    /<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi,
  )) {
    candidates.push(normalizeLgAssetUrl(m[1]))
  }

  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0]
      if (url) candidates.push(normalizeLgAssetUrl(url))
    }
  }

  for (const m of html.matchAll(
    /(?:https?:\/\/www\.lg\.com)?\/content\/dam\/channel\/wcms[^"'\\\s<>]+\.(?:jpe?g|png|webp)(?:\/jcr:content\/renditions\/[^"'\\\s<>]+)?/gi,
  )) {
    candidates.push(normalizeLgAssetUrl(m[0]))
  }

  const filtered = dedupeUrls(candidates.filter(isLikelyProductImageUrl))
    .sort((a, b) => imagePriority(b) - imagePriority(a))

  return filtered.slice(0, limit)
}
