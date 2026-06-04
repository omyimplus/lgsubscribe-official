import type { Category } from '../types/category'
import type { Product } from '../types/product'
import type { ProductDisplayGroup } from './productGroupDisplay'
import { cardMonthlyPriceForListing } from './planPricing'

export type ProductSortKey =
  | 'default'
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'

/** จำนวนการ์ด (กลุ่มสินค้า) ต่อหน้า PLP */
export const PRODUCT_LIST_PAGE_SIZE = 9

export const PRODUCT_SORT_OPTIONS: { value: ProductSortKey, label: string }[] = [
  { value: 'default', label: 'ลำดับมาตรฐาน' },
  { value: 'name_asc', label: 'ชื่อ ก–ฮ' },
  { value: 'name_desc', label: 'ชื่อ ฮ–ก' },
  { value: 'price_asc', label: 'ราคา/เดือน ต่ำ → สูง' },
  { value: 'price_desc', label: 'ราคา/เดือน สูง → ต่ำ' },
]

const SORT_KEYS = new Set(PRODUCT_SORT_OPTIONS.map(o => o.value))

export function isProductSortKey(value: string): value is ProductSortKey {
  return SORT_KEYS.has(value as ProductSortKey)
}

export function resolveCategoryIdBySlug(
  slug: string,
  categories: Pick<Category, 'id' | 'slug'>[],
): string | null {
  const s = slug.trim()
  if (!s) return null
  return categories.find(c => c.slug === s)?.id ?? null
}

export function filterProductsByCategoryId(
  products: Product[],
  categoryId: string | null,
): Product[] {
  if (!categoryId) return products
  return products.filter(p => p.category_id === categoryId)
}

/** ค้นหาชื่อ / รหัสสินค้า / หัวข้อโปรโมชั่น */
export function filterProductsBySearch(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return products
  return products.filter((p) => {
    const hay = [
      p.name,
      p.sku,
      p.headline,
      p.product_group?.display_name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

/** ราคา/เดือนที่การ์ดแสดง (variant แรกในกลุ่ม) */
export function groupDisplayMonthlyPrice(group: ProductDisplayGroup): number | null {
  const lead = group.variants[0]
  if (!lead) return null
  const fromPlan = cardMonthlyPriceForListing(lead.plan_pricing)
  if (fromPlan != null) return fromPlan
  if (lead.discounted_price != null) return Number(lead.discounted_price)
  return Number(lead.base_price) || null
}

export function sortProductDisplayGroups(
  groups: ProductDisplayGroup[],
  sortKey: ProductSortKey,
): ProductDisplayGroup[] {
  if (sortKey === 'default') return groups

  const list = [...groups]
  if (sortKey === 'name_asc' || sortKey === 'name_desc') {
    const dir = sortKey === 'name_asc' ? 1 : -1
    return list.sort((a, b) => dir * a.displayName.localeCompare(b.displayName, 'th'))
  }

  const dir = sortKey === 'price_asc' ? 1 : -1
  return list.sort((a, b) => {
    const pa = groupDisplayMonthlyPrice(a)
    const pb = groupDisplayMonthlyPrice(b)
    if (pa == null && pb == null) return a.displayName.localeCompare(b.displayName, 'th')
    if (pa == null) return 1
    if (pb == null) return -1
    if (pa !== pb) return dir * (pa - pb)
    return a.displayName.localeCompare(b.displayName, 'th')
  })
}
