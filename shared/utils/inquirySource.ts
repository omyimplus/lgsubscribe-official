import type { InquirySource } from '~~/shared/types/inquiry'

export const INQUIRY_SOURCE_LABELS: Record<InquirySource, string> = {
  product_cart: 'สนใจสินค้า (ตะกร้า)',
  corporate: 'ลูกค้าองค์กร',
}

export function inquirySourceLabel(source?: InquirySource | string | null): string {
  if (source === 'corporate') return INQUIRY_SOURCE_LABELS.corporate
  return INQUIRY_SOURCE_LABELS.product_cart
}
