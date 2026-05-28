import type { DiscountType } from '~~/shared/types/product'

export function computeProductPricing(
  basePrice: number,
  discountType?: DiscountType | null,
  discountValue?: number | null,
) {
  const base = Number(basePrice) || 0
  let discounted = base
  const type = discountType ?? null
  const value = Number(discountValue) || 0

  if (type === 'amount' && value > 0) {
    discounted = Math.max(0, base - value)
  }
  else if (type === 'percent' && value > 0) {
    discounted = Math.max(0, base * (1 - value / 100))
  }

  const discountPercent = base > 0
    ? Math.round((1 - discounted / base) * 10000) / 100
    : 0

  return {
    discounted_price: Math.round(discounted * 100) / 100,
    discount_percent: discountPercent,
  }
}
