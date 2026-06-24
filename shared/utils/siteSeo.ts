export const SITE_NAME = 'LG Subscribe'

export const SITE_DEFAULT_DESCRIPTION =
  'เริ่มต้นเพียงหลักร้อย จ่ายง่ายผ่อนสบาย สมัครใช้เครื่องใช้ไฟฟ้า LG แบบรายเดือน'

/** รูป OG เริ่มต้น — logo แบรนด์ */
export const SITE_DEFAULT_OG_IMAGE = '/images/logo-lg-subscribe.webp'

export function joinKeywords(...parts: (string | string[] | undefined | null)[]): string {
  const seen = new Set<string>()
  for (const part of parts) {
    if (!part) continue
    const items = Array.isArray(part) ? part : [part]
    for (const item of items) {
      for (const token of String(item).split(',')) {
        const trimmed = token.trim()
        if (trimmed) seen.add(trimmed)
      }
    }
  }
  return [...seen].join(', ')
}

export const SITE_PUBLIC_ROUTES = [
  '/',
  '/products',
  '/promotions',
  '/articles',
  '/articles/knowledge',
  '/articles/how-to-order',
  '/articles/why-subscribe',
  '/corporate',
  '/contact',
  '/trust',
  '/faq',
  '/installment',
  '/privacy',
  '/experiences',
  '/careers/apply',
] as const

export const SITE_NOINDEX_PREFIXES = [
  '/admin',
  '/auth',
  '/account',
  '/subscribe/inquiry',
] as const

export function formatSiteTitle(title: string): string {
  const t = title.trim()
  if (!t) return SITE_NAME
  if (t.includes('LG Subscribe')) return t
  return `${t} | ${SITE_NAME}`
}

export function resolveSiteUrl(path: string, siteUrl: string): string {
  if (!path) return siteUrl
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = siteUrl.replace(/\/$/, '')
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
}
