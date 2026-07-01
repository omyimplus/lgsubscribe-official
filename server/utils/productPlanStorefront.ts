import type {
  ProductPlan,
  ProductPlanCardOption,
  ProductPlanPricingSummary,
} from '~~/shared/types/productPlan'
import type { Product } from '~~/shared/types/product'
import {
  displayPriceForCard,
  displayPriceNote,
  totalContractAmount,
  totalNetAmount,
} from '~~/shared/utils/planPricing'
import { pickStorefrontPlans } from '~~/shared/utils/planDisplay'
import { buildPlanPricingSummary, planToCardOption } from '~~/shared/utils/planCardOption'
import { mapPlanRow } from '~~/server/utils/productPlansDb'
import { attachGiftsToPlans } from '~~/server/utils/planGiftsDb'
import { planGiftsToInquirySnapshots } from '~~/shared/utils/planGiftDisplay'

type SupabaseAdmin = ReturnType<typeof useSupabaseAdmin>

const planSelect = `
  *,
  billing_tiers:plan_billing_tiers (*)
`

export interface StorefrontPlansBundle {
  plan_pricing: ProductPlanPricingSummary | null
  plans: ProductPlanCardOption[]
}

function pickDefaultPlan(
  plans: ProductPlan[],
  defaultPlanId: string | null,
): ProductPlan | null {
  if (!plans.length) return null
  if (defaultPlanId) {
    const matched = plans.find(p => p.id === defaultPlanId)
    if (matched) return matched
  }
  return plans.find(p => p.is_default) ?? plans[0]!
}

export async function fetchStorefrontPlansForProducts(
  supabase: SupabaseAdmin,
  products: Pick<Product, 'id' | 'default_plan_id'>[],
): Promise<Map<string, StorefrontPlansBundle>> {
  const productIds = products.map(p => p.id)
  if (!productIds.length) return new Map()

  const { data, error } = await supabase
    .from('product_plans')
    .select(planSelect)
    .in('product_id', productIds)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  const plansByProduct = new Map<string, ProductPlan[]>()
  for (const row of data ?? []) {
    const plan = mapPlanRow(row as Record<string, unknown>)
    const list = plansByProduct.get(plan.product_id) ?? []
    list.push(plan)
    plansByProduct.set(plan.product_id, list)
  }

  const allPlans = [...plansByProduct.values()].flat()
  await attachGiftsToPlans(supabase, allPlans)

  const defaultByProductId = new Map(products.map(p => [p.id, p.default_plan_id]))
  const result = new Map<string, StorefrontPlansBundle>()

  for (const productId of productIds) {
    const plans = plansByProduct.get(productId) ?? []
    if (!plans.length) {
      result.set(productId, { plan_pricing: null, plans: [] })
      continue
    }

    const activePlans = pickStorefrontPlans(plans)
    const cardPlans = activePlans.map(planToCardOption)
    const fromPrices = cardPlans
      .map(p => p.display_monthly_price)
      .filter((n): n is number => n != null)
    const fromMonthlyPrice = fromPrices.length ? Math.min(...fromPrices) : null

    const defaultPlan = pickDefaultPlan(activePlans, defaultByProductId.get(productId) ?? null)
    const plan_pricing = defaultPlan
      ? buildPlanPricingSummary(defaultPlan, activePlans.length, fromMonthlyPrice)
      : null

    result.set(productId, { plan_pricing, plans: cardPlans })
  }

  return result
}

/** @deprecated ใช้ fetchStorefrontPlansForProducts แทน */
export async function fetchDefaultPlanPricingSummaries(
  supabase: SupabaseAdmin,
  products: Pick<Product, 'id' | 'default_plan_id'>[],
): Promise<Map<string, ProductPlanPricingSummary>> {
  const bundles = await fetchStorefrontPlansForProducts(supabase, products)
  const result = new Map<string, ProductPlanPricingSummary>()
  for (const [id, bundle] of bundles) {
    if (bundle.plan_pricing) result.set(id, bundle.plan_pricing)
  }
  return result
}

export function planToInquirySnapshot(
  product: Pick<Product, 'id' | 'sku' | 'name' | 'image_url'>,
  plan: ProductPlan | ProductPlanCardOption,
) {
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
    plan_title: plan.plan_title ?? null,
    service_mode: plan.service_mode,
    service_interval_months: plan.service_interval_months ?? null,
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
    has_gift: plan.has_gift,
    gift_items: planGiftsToInquirySnapshots(plan.gift_items ?? []),
  }
}
