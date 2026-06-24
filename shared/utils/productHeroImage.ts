/** รวม URL รูปสินค้า — image_url (canonical) มาก่อน แล้วตามด้วย gallery ที่ไม่ซ้ำ */
export function productGalleryUrls(product: {
  image_url?: string | null
  image_urls?: string[] | null
} | null | undefined): string[] {
  if (!product) return []
  const urls: string[] = []
  const push = (raw: string | null | undefined) => {
    const url = String(raw ?? '').trim()
    if (!url || urls.includes(url)) return
    urls.push(url)
  }
  push(product.image_url)
  for (const item of product.image_urls ?? []) push(item)
  return urls
}

export function primaryProductImageUrl(product: {
  image_url?: string | null
  image_urls?: string[] | null
} | null | undefined): string {
  return productGalleryUrls(product)[0] ?? ''
}

/** LG hotlink บางครั้ง block บน Safari iOS — ใช้ no-referrer ช่วยได้ */
export function productImageReferrerPolicy(url: string): 'no-referrer' | undefined {
  return /lg\.com/i.test(url) ? 'no-referrer' : undefined
}
