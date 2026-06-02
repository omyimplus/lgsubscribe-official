import type { Product } from '~~/shared/types/product'
import type { ProductPlan, ProductPlanPricingSummary } from '~~/shared/types/productPlan'

export function cardMonthlyPrice(pricing: ProductPlanPricingSummary | null | undefined): number | null {
  if (!pricing) return null
  if (pricing.plan_count > 1 && pricing.from_monthly_price != null) {
    return pricing.from_monthly_price
  }
  return pricing.display_monthly_price
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
