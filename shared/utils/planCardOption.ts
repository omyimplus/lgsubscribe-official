import type {
  ProductPlan,
  ProductPlanCardOption,
  ProductPlanPricingSummary,
} from '~~/shared/types/productPlan'
import {
  displayPriceForCard,
  displayPriceNote,
  totalContractAmount,
  totalNetAmount,
} from '~~/shared/utils/planPricing'

export function planToCardOption(plan: ProductPlan): ProductPlanCardOption {
  const tiers = plan.billing_tiers ?? []
  const computed_total = tiers.length ? totalContractAmount(tiers) : null
  return {
    id: plan.id,
    contract_label: plan.contract_label,
    plan_title: plan.plan_title ?? null,
    contract_years: plan.contract_years,
    contract_months: plan.contract_months,
    service_mode: plan.service_mode,
    service_interval_months: plan.service_interval_months,
    policy_code: plan.policy_code,
    advance_amount: plan.advance_amount,
    advance_note: plan.advance_note,
    display_monthly_price: displayPriceForCard(tiers),
    display_price_note: displayPriceNote(tiers),
    computed_total,
    computed_net_total: computed_total != null ? totalNetAmount(computed_total, plan.advance_amount) : null,
    is_default: plan.is_default,
    sort_order: plan.sort_order,
    billing_tiers: tiers.map(t => ({
      bill_from: t.bill_from,
      bill_to: t.bill_to,
      monthly_price: t.monthly_price,
      note: t.note,
      sort_order: t.sort_order,
    })),
    has_gift: plan.has_gift,
    gift_items: plan.gift_items ?? [],
  }
}

export function buildPlanPricingSummary(
  plan: ProductPlan,
  planCount: number,
  fromMonthlyPrice: number | null,
): ProductPlanPricingSummary {
  const tiers = plan.billing_tiers ?? []
  const computed_total = tiers.length ? totalContractAmount(tiers) : null
  return {
    plan_id: plan.id,
    contract_label: plan.contract_label,
    plan_title: plan.plan_title ?? null,
    contract_years: plan.contract_years,
    service_mode: plan.service_mode,
    display_monthly_price: displayPriceForCard(tiers),
    display_price_note: displayPriceNote(tiers),
    computed_total,
    computed_net_total: computed_total != null ? totalNetAmount(computed_total, plan.advance_amount) : null,
    advance_amount: plan.advance_amount,
    advance_note: plan.advance_note,
    plan_count: planCount,
    from_monthly_price: fromMonthlyPrice,
  }
}
