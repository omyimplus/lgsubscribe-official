import type { InquiryItem } from '~~/shared/types/inquiry'
import type { Product } from '~~/shared/types/product'
import type { ProductPlan, ProductPlanCardOption } from '~~/shared/types/productPlan'
import { displayPriceForCard, displayPriceNote, totalContractAmount, totalNetAmount } from '~~/shared/utils/planPricing'

/** แปลงสินค้า + แผนที่เลือก เป็นรายการสำหรับตารางผ่อน / ตะกร้า / คำขอ */
export function planToInquiryItem(
  product: Pick<Product, 'id' | 'sku' | 'name' | 'image_url'>,
  plan: ProductPlan | ProductPlanCardOption,
): InquiryItem {
  const tiers = plan.billing_tiers ?? []
  const computed_total = tiers.length ? totalContractAmount(tiers) : undefined
  const display_monthly_price = displayPriceForCard(tiers) ?? 0

  return {
    product_id: product.id,
    plan_id: plan.id,
    sku: product.sku,
    name: product.name,
    image_url: product.image_url,
    policy_code: plan.policy_code ?? '',
    contract_label: plan.contract_label,
    service_mode: plan.service_mode,
    contract_years: plan.contract_years,
    contract_months: plan.contract_months,
    billing_tiers: tiers.map(t => ({
      bill_from: t.bill_from,
      bill_to: t.bill_to,
      monthly_price: t.monthly_price,
      note: t.note ?? null,
    })),
    advance_amount: plan.advance_amount,
    advance_note: plan.advance_note,
    display_monthly_price,
    display_price_note: displayPriceNote(tiers),
    computed_total,
    computed_net_total: computed_total != null ? totalNetAmount(computed_total, plan.advance_amount) : undefined,
    monthly_price: display_monthly_price,
    quantity: 1,
  }
}

export function defaultPlanForProduct(
  product: Pick<Product, 'plans' | 'plan_pricing'>,
): ProductPlanCardOption | null {
  const plans = product.plans ?? []
  if (!plans.length) return null
  const preferredId = product.plan_pricing?.plan_id
  if (preferredId) {
    const match = plans.find(p => p.id === preferredId)
    if (match) return match
  }
  return plans[0]!
}
