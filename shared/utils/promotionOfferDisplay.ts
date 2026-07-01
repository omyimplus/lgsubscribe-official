import type { PromotionProductOffer, PromotionProductOfferEnriched } from '~~/shared/types/promotion'
import type { Product } from '~~/shared/types/product'

export function promotionOfferTitle(
  offer: Pick<PromotionProductOffer, 'title_override'>,
  product?: Pick<Product, 'name'> | null,
) {
  return offer.title_override?.trim() || product?.name?.trim() || 'สินค้าในโปรโมชั่น'
}

export function promotionOfferHasPrices(
  offer: Pick<PromotionProductOffer, 'installment_monthly' | 'installment_total'>,
) {
  return offer.installment_monthly != null || offer.installment_total != null
}

export function promotionGiftDisplayLabel(
  gift: PromotionProductOfferEnriched['gift_items'][number],
) {
  const label = gift.label?.trim()
  if (label) return label
  if (gift.product?.name) return gift.product.name
  return gift.product?.sku ?? 'ของแถม'
}
