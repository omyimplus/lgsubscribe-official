import { getLgSubscriptionSource } from './lgSubscriptionSources'

const LG_HOST_RE = /(^|\.)lg\.com$/i

/** segment ใน path LG → slug หมวดในระบบเรา */
const LG_PATH_SEGMENT_TO_CATEGORY: Record<string, string> = {
  'tv-soundbars': 'television',
  'tvs': 'television',
  'soundbars': 'soundbar',
  'laundry': 'washing-machine',
  'washers': 'washing-machine',
  'dryers': 'dryer',
  'styler': 'styler',
  'refrigerators': 'refrigerator',
  'vacuum-cleaners': 'vacuum-cleaner',
  'vacuum-cleaner': 'vacuum-cleaner',
  'microwave-ovens': 'microwave-oven',
  'dishwashers': 'dishwasher',
  'water-purifiers': 'water-purifier',
  'air-conditioner-inverter': 'air-conditioner',
  'air-conditioners': 'air-conditioner',
  'air-purifiers': 'air-purifier',
  'dehumidifier': 'dehumidifier',
  'monitors': 'monitor',
  'computing': 'monitor',
  'speakers': 'speakers',
  'portable-speakers': 'speakers',
  'xboom': 'speakers',
  'xboom-go': 'speakers',
  'lifestyle-screens': 'lifestyle-screens',
}

function inferFromPathSegments(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const segments = parts[0] === 'th' ? parts.slice(1) : parts

  for (const seg of segments) {
    if (/^all-/i.test(seg)) continue
    const hit = LG_PATH_SEGMENT_TO_CATEGORY[seg.toLowerCase()]
    if (hit) return hit
  }

  const lower = pathname.toLowerCase()
  if (lower.includes('tv-soundbar') || lower.includes('/oled') || lower.includes('/qned')) return 'television'
  if (lower.includes('air-conditioner') || lower.includes('dualcool')) return 'air-conditioner'
  if (lower.includes('/laundry/') || lower.includes('wash-tower') || lower.includes('washing-machine')) {
    return 'washing-machine'
  }
  if (lower.includes('refrigerator') || lower.includes('side-by-side')) return 'refrigerator'
  if (lower.includes('soundbar')) return 'soundbar'
  if (lower.includes('vacuum-cleaner') || lower.includes('vacuum-cleaners') || lower.includes('cordzero')) {
    return 'vacuum-cleaner'
  }
  if (lower.includes('/speakers/') || lower.includes('portable-speaker') || lower.includes('/xboom')) {
    return 'speakers'
  }
  if (lower.includes('lifestyle-screen')) return 'lifestyle-screens'
  if (lower.includes('monitor')) return 'monitor'

  return null
}

/** อนุมานหมวดในระบบเราจาก URL หมวด LG */
export function inferCategorySlugFromLgListUrl(listUrlInput: string) {
  const listUrl = normalizeLgCategoryListUrl(listUrlInput)
  return inferFromPathSegments(new URL(listUrl).pathname)
}

/** สำรองจาก URL สินค้า (หลัง scrape) เช่น /th/tv-soundbars/.../lgsubscribe */
export function inferCategorySlugFromLgProductUrl(sourceUrl: string | null | undefined) {
  if (!sourceUrl?.trim()) return null
  try {
    return inferFromPathSegments(new URL(sourceUrl.trim()).pathname)
  }
  catch {
    return null
  }
}

export function resolveCategorySlugForUrlImport(
  listUrlInput: string,
  productUrls: Array<string | null | undefined> = [],
) {
  const fromList = inferCategorySlugFromLgListUrl(listUrlInput)
  if (fromList) return fromList

  for (const url of productUrls) {
    const fromProduct = inferCategorySlugFromLgProductUrl(url)
    if (fromProduct) return fromProduct
  }

  throw createError({
    statusCode: 400,
    message: 'ไม่สามารถอนุมานหมวดจาก URL นี้ได้ — ใช้ URL ภายใต้หมวด LG ที่รองรับ เช่น tv-soundbars, laundry, air-conditioner-inverter',
  })
}

/** ตรวจและ normalize URL หมวดสินค้า LG (ไม่ใช่ subscription PLP ก็ได้) */
export function normalizeLgCategoryListUrl(input: string) {
  const trimmed = String(input ?? '').trim()
  if (!trimmed) {
    throw createError({ statusCode: 400, message: 'กรุณาระบุ URL หมวดสินค้า LG' })
  }

  let url: URL
  try {
    url = trimmed.startsWith('http')
      ? new URL(trimmed)
      : new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, 'https://www.lg.com')
  }
  catch {
    throw createError({ statusCode: 400, message: 'URL ไม่ถูกต้อง — ตัวอย่าง https://www.lg.com/th/tv-soundbars/all-tvs-soundbars/' })
  }

  if (!LG_HOST_RE.test(url.hostname)) {
    throw createError({ statusCode: 400, message: 'URL ต้องเป็นโดเมน lg.com เท่านั้น' })
  }
  if (!url.pathname.startsWith('/th/')) {
    throw createError({ statusCode: 400, message: 'URL ต้องอยู่ใต้ /th/ (เว็บ LG ไทย)' })
  }
  if (url.pathname.includes('/lgsubscribe')) {
    throw createError({ statusCode: 400, message: 'ใช้ URL หมวดสินค้า (PLP) ไม่ใช่หน้ารายละเอียด lgsubscribe' })
  }

  url.hash = ''
  if (!url.pathname.endsWith('/')) {
    url.pathname = `${url.pathname}/`
  }

  return url.toString()
}

export function lgListPathFromUrl(listUrl: string) {
  const normalized = normalizeLgCategoryListUrl(listUrl)
  const pathname = new URL(normalized).pathname
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

export function variantAxisForCategorySlug(categorySlug: string) {
  const source = getLgSubscriptionSource(categorySlug)
  return source?.variantAxis ?? 'other'
}

export function labelFromListUrl(listUrl: string) {
  try {
    const parts = new URL(listUrl).pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1] ?? 'lg'
    return last.replace(/-/g, ' ')
  }
  catch {
    return 'LG URL'
  }
}
