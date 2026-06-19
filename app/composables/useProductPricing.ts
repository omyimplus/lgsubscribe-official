import type { DiscountType } from '~~/shared/types/product'

export { formatBaht } from '~~/shared/utils/moneyFormat'

export function useProductPricing(
  basePrice: Ref<number> | number,
  discountType: Ref<DiscountType | '' | null> | DiscountType | '' | null,
  discountValue: Ref<number | null> | number | null,
) {
  return computed(() => {
    const base = Number(unref(basePrice)) || 0
    const type = unref(discountType) || null
    const value = Number(unref(discountValue)) || 0
    let discounted = base

    if (type === 'amount' && value > 0) discounted = Math.max(0, base - value)
    else if (type === 'percent' && value > 0) discounted = Math.max(0, base * (1 - value / 100))

    const percent = base > 0 ? Math.round((1 - discounted / base) * 10000) / 100 : 0
    return { discounted_price: Math.round(discounted * 100) / 100, discount_percent: percent }
  })
}
