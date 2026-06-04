import type { Product } from '~~/shared/types/product'
import type { ProductPlan, ProductPlanPricingSummary } from '~~/shared/types/productPlan'
import { cardMonthlyPriceForListing } from '~~/shared/utils/planPricing'

export function cardMonthlyPrice(
  pricing: Parameters<typeof cardMonthlyPriceForListing>[0],
): number | null {
  return cardMonthlyPriceForListing(pricing)
}

export function cardPricePrefix(pricing: ProductPlanPricingSummary | null | undefined): string {
  if (pricing && pricing.plan_count > 1) return 'เริ่ม '
  return ''
}

export function productHasPlanPricing(product: Pick<Product, 'plan_pricing' | 'plans'>): boolean {
  if (product.plans?.length) return true
  return Boolean(product.plan_pricing?.plan_id && product.plan_pricing.display_monthly_price != null)
}

export function planCardMonthlyPrice(plan: ProductPlan): number | null {
  return plan.display_monthly_price ?? null
}
