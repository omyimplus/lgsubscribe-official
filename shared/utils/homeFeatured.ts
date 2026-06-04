/** Tag ใน DB สำหรับ section สินค้าแนะนำบนหน้าแรก */
export const HOME_FEATURED_TAG_SLUG = 'home-featured'

export const HOME_FEATURED_TAG_NAME = 'สินค้าแนะนำ'

/** คำสั้นที่แสดงบนหน้าร้าน (แท็กใน admin ยังชื่อเต็ม) */
export const HOME_FEATURED_TAG_LABEL = 'แนะนำ'

export type TagLike = { slug?: string | null, name?: string | null }

export function isHomeFeaturedTag(tag: TagLike) {
  const slug = tag.slug?.trim()
  const name = tag.name?.trim()
  return slug === HOME_FEATURED_TAG_SLUG || name === HOME_FEATURED_TAG_NAME
}

export function productHasHomeFeaturedTag(product: { tags?: TagLike[] | null }) {
  return (product.tags ?? []).some(isHomeFeaturedTag)
}

/** แท็กระบบ — ห้ามลบ / ห้ามเปลี่ยน slug หรือปิดใช้งาน */
export function isProtectedSystemTag(tag: TagLike) {
  return isHomeFeaturedTag(tag)
}
