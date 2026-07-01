import type { PlanGift, PlanGiftEnriched } from '~~/shared/types/productPlan'
import type { InquiryPlanGiftSnapshot } from '~~/shared/types/inquiry'

export type PlanGiftDisplayItem = PlanGiftEnriched | InquiryPlanGiftSnapshot

export function planGiftDisplayLabel(gift: PlanGiftDisplayItem) {
  const label = gift.label?.trim()
  if (label) return label
  if ('product' in gift && gift.product?.name) return gift.product.name
  if ('name' in gift && gift.name) return gift.name
  if ('product' in gift && gift.product?.sku) return gift.product.sku
  if ('sku' in gift && gift.sku) return gift.sku
  return 'ของแถม'
}

export function planGiftsToInquirySnapshots(gifts: PlanGiftEnriched[]): InquiryPlanGiftSnapshot[] {
  return gifts.map(gift => ({
    product_id: gift.product_id,
    label: gift.label,
    name: gift.product?.name ?? null,
    sku: gift.product?.sku ?? null,
    image_url: gift.product?.image_url ?? null,
  }))
}

export function planHasGiftItems(
  plan: { has_gift?: boolean, gift_items?: PlanGift[] | null },
) {
  return Boolean(plan.has_gift && (plan.gift_items?.length ?? 0) > 0)
}
