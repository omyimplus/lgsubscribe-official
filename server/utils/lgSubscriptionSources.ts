/**
 * LG Subscribe PLP sources — สอดคล้อง LG_SUBSCRIPTION_SOURCE_URLS.md
 * ห้ามประกอบ detail URL เอง: ดึง href จาก DOM การ์ดเท่านั้น
 *
 * Variant chips (ทีวีนิ้ว / แอร์ BTU): DOM รูปแบบเดียวกัน
 * `.neo-card--sibling button.swatch[data-model-id]`
 */

export const LG_SUBSCRIPTION_ACTIVE = 'ec_model_status_code=ACTIVE'
export const LG_SUBSCRIPTION_PAGE_SIZE = 9

/** ปุ่มเลือกขนาด/ความจุบนการ์ด — ใช้ร่วมทุกหมวดที่มี sibling swiper */
export const LG_VARIANT_SWATCH_SELECTOR = '.neo-card--sibling button.swatch[data-model-id]'

export type LgSubscriptionSource = {
  /** path segment บน lg.com เช่น tvs, air-conditioners */
  lgSlug: string
  label: string
  /** slug ใน categories ของเรา (ถ้ามี) */
  categorySlug: string | null
  listUrl: string
  /** ปุ่ม variant บนการ์ด — ทีวี vs แอร์ใช้ DOM ต่างกัน */
  variantChipSelector: string
  variantAxis: 'screen_inches' | 'btu' | 'other'
}

const BASE = 'https://www.lg.com/th/subscription'

function listUrl(lgSlug: string, withActive = true) {
  const q = withActive ? `?${LG_SUBSCRIPTION_ACTIVE}` : ''
  return `${BASE}/${lgSlug}/${q}`
}

/** หน้า list ถัดไป: firstResult=9,18,27,... */
export function listUrlWithOffset(lgSlug: string, firstResult: number) {
  const base = listUrl(lgSlug, true)
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}firstResult=${firstResult}`
}

/** URL หน้า PLP (pageIndex 0 = หน้าแรก, 1 = firstResult=9, ...) */
export function subscriptionListPageUrl(listUrl: string, pageIndex: number) {
  if (pageIndex <= 0) return listUrl
  const offset = pageIndex * LG_SUBSCRIPTION_PAGE_SIZE
  const sep = listUrl.includes('?') ? '&' : '?'
  return `${listUrl}${sep}firstResult=${offset}`
}

export const LG_SUBSCRIPTION_SOURCES: LgSubscriptionSource[] = [
  { lgSlug: 'all', label: 'ทั้งหมด', categorySlug: null, listUrl: listUrl('all'), variantChipSelector: '', variantAxis: 'other' },
  { lgSlug: 'tvs', label: 'โทรทัศน์', categorySlug: 'television', listUrl: listUrl('tvs'), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'screen_inches' },
  { lgSlug: 'soundbars', label: 'ลำโพง Soundbars', categorySlug: 'soundbar', listUrl: listUrl('soundbars'), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
  { lgSlug: 'washers', label: 'เครื่องซักผ้า', categorySlug: 'washing-machine', listUrl: listUrl('washers'), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
  { lgSlug: 'dryers', label: 'เครื่องอบผ้า', categorySlug: 'dryer', listUrl: listUrl('dryers'), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
  { lgSlug: 'styler', label: 'ตู้ถนอมผ้า', categorySlug: 'styler', listUrl: listUrl('styler'), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
  { lgSlug: 'refrigerators', label: 'ตู้เย็น', categorySlug: 'refrigerator', listUrl: listUrl('refrigerators'), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
  { lgSlug: 'vacuum-cleaners', label: 'เครื่องดูดฝุ่น', categorySlug: 'vacuum-cleaner', listUrl: listUrl('vacuum-cleaners'), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
  { lgSlug: 'microwave-ovens', label: 'ไมโครเวฟ', categorySlug: 'microwave-oven', listUrl: listUrl('microwave-ovens', false), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
  { lgSlug: 'dishwashers', label: 'เครื่องล้างจาน', categorySlug: 'dishwasher', listUrl: listUrl('dishwashers'), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
  { lgSlug: 'water-purifiers', label: 'เครื่องกรองน้ำ', categorySlug: 'water-purifier', listUrl: listUrl('water-purifiers'), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
  {
    lgSlug: 'air-conditioners',
    label: 'เครื่องปรับอากาศ',
    categorySlug: 'air-conditioner',
    listUrl: listUrl('air-conditioners'),
    variantChipSelector: LG_VARIANT_SWATCH_SELECTOR,
    variantAxis: 'btu',
  },
  { lgSlug: 'air-purifiers', label: 'เครื่องฟอกอากาศ', categorySlug: 'air-purifier', listUrl: listUrl('air-purifiers'), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
  { lgSlug: 'dehumidifier', label: 'เครื่องลดความชื้น', categorySlug: 'dehumidifier', listUrl: listUrl('dehumidifier', false), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
  { lgSlug: 'monitors', label: 'จอมอนิเตอร์', categorySlug: 'monitor', listUrl: listUrl('monitors'), variantChipSelector: LG_VARIANT_SWATCH_SELECTOR, variantAxis: 'other' },
]

/** รูปแบบ SKU LG บนเว็บ — รองรับรุ่นสั้น เช่น GRAB (ลำโพงพกพา) */
export const LG_SKU_RE = /^(?=.*[A-Z])[A-Z0-9]{4,24}$/

/** ตัดช่องว่าง/ขีดจากชื่อรุ่นบนการ์ด (เช่น A9T-CORE → A9TCORE) */
export function compactLgSku(text: string) {
  return String(text ?? '').trim().toUpperCase().replace(/[\s-]+/g, '')
}

export function isValidLgProductSku(sku: string | null | undefined) {
  const raw = compactLgSku(sku)
  return LG_SKU_RE.test(raw)
}

/** แปลง data-model-id LG เป็น SKU สั้น (OLED65C6PSA.ATM.EATH.TH.C → OLED65C6PSA) */
export function skuFromLgModelId(modelId: string) {
  const raw = modelId.trim().toUpperCase()
  const short = (raw.split('.')[0] ?? '').trim()
  if (LG_SKU_RE.test(short)) return short
  const compact = compactLgSku(short)
  if (LG_SKU_RE.test(compact)) return compact
  const m = raw.match(/([A-Z0-9]{5,24})/)
  return m?.[1] && LG_SKU_RE.test(m[1]) ? m[1] : ''
}

/** ชื่อบนการ์ด PLP ให้ตรงขนาดจอ/BTU + SKU (ป้าย swatch ถูก แต่หัวการ์ดมักค้างรุ่นแรก) */
export function buildVariantCardName(
  plpName: string | null | undefined,
  variantLabel: string | null | undefined,
  sku: string,
) {
  const skuUpper = sku.trim().toUpperCase()
  if (!plpName?.trim()) return skuUpper
  let name = plpName.trim().replace(/รุ่น\s+[A-Z0-9-]+/gi, `รุ่น ${skuUpper}`)

  const btuLabel = variantLabel?.match(/(\d[\d,]*)\s*BTU/i)
  if (btuLabel && /\d[\d,]*\s*BTU/i.test(name)) {
    name = name.replace(/\d[\d,]*\s*BTU/i, `${btuLabel[1]} BTU`)
  }

  const inch = variantLabel?.match(/(\d+)\s*(?:inch|นิ้ว|")/i)?.[1]
    ?? (variantLabel && !/BTU/i.test(variantLabel) ? variantLabel.match(/(\d+)/)?.[1] : null)
  if (inch && /ทีวี/i.test(name)) {
    if (/ทีวี\s*\d+/i.test(name)) {
      name = name.replace(/ทีวี\s*\d+\s*"/i, `ทีวี ${inch}"`)
    }
    else {
      name = name.replace(/^ทีวี/i, `ทีวี ${inch}"`)
    }
  }
  return name
}

export function resolveLgProductSku(modelId?: string | null, domSkuText?: string | null) {
  if (modelId?.trim()) {
    const fromId = skuFromLgModelId(modelId)
    if (fromId) return fromId
  }
  const text = String(domSkuText ?? '').trim().toUpperCase()
  if (!text || /COPY/i.test(text)) return ''
  const compact = compactLgSku(text.replace(/COPY.*$/i, ''))
  // รุ่นที่ขึ้นต้นด้วยตัวเลข เช่น 65QNED80BSA — ต้องใช้ทั้งสตริง ไม่ใช่แค่ส่วน QNED80BSA
  if (LG_SKU_RE.test(compact)) return compact
  const m = compact.match(/([A-Z]{1,5}\d{2,}[A-Z0-9]{2,})/)
  return m?.[1] && LG_SKU_RE.test(m[1]) && !/COPY/i.test(m[1]) ? m[1] : ''
}

export function getLgSubscriptionSource(lgSlugOrCategorySlug: string) {
  const key = lgSlugOrCategorySlug.toLowerCase()
  return LG_SUBSCRIPTION_SOURCES.find(
    s => s.lgSlug === key || s.categorySlug === key,
  )
}

/** หมวดที่ import ได้ทีละหมวด (ไม่รวม "ทั้งหมด") */
export function getImportableLgSubscriptionSources() {
  return LG_SUBSCRIPTION_SOURCES.filter(
    (s): s is LgSubscriptionSource & { categorySlug: string } =>
      s.lgSlug !== 'all' && Boolean(s.categorySlug),
  )
}

/** path สำหรับ ncms-debug-path / referer ตอนเรียก retrieveProductList */
export function lgSubscriptionListPath(lgSlug: string) {
  return `/th/subscription/${lgSlug.replace(/^\/+|\/+$/g, '')}/`
}

/** ค่าเริ่มต้นตอน dev (ทีวี) — คง backward compat กับ lgTvImport */
export const LG_TV_LIST_URL = getLgSubscriptionSource('tvs')!.listUrl
export const LG_AC_LIST_URL = getLgSubscriptionSource('air-conditioners')!.listUrl
