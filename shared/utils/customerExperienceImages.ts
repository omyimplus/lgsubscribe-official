/** จำนวนรูปสูงสุดต่อกิจกรรม */
export const CUSTOMER_EXPERIENCE_MAX_IMAGES = 20

export function normalizeCustomerExperienceImageUrls(value: unknown): string[] {
  if (!value) return []
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const url = item.trim()
    if (!url || seen.has(url)) continue
    seen.add(url)
    out.push(url)
    if (out.length >= CUSTOMER_EXPERIENCE_MAX_IMAGES) break
  }
  return out
}

/** รูปหลักสำหรับ thumbnail / fallback */
export function primaryCustomerExperienceImage(
  imageUrls: string[] | null | undefined,
  imageUrl?: string | null,
): string | null {
  const urls = normalizeCustomerExperienceImageUrls(imageUrls)
  if (urls.length) return urls[0]!
  const legacy = imageUrl?.trim()
  return legacy || null
}

export function customerExperienceGalleryUrls(
  imageUrls: string[] | null | undefined,
  imageUrl?: string | null,
): string[] {
  const urls = normalizeCustomerExperienceImageUrls(imageUrls)
  if (urls.length) return urls
  const legacy = imageUrl?.trim()
  return legacy ? [legacy] : []
}
