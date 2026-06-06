import type { InquiryItem } from '~~/shared/types/inquiry'
import type { Product } from '~~/shared/types/product'
import type { ProductPlanCardOption } from '~~/shared/types/productPlan'
import { planToInquiryItem } from '~~/shared/utils/cartItemFromPlan'
import {
  buildInstallmentSchedule,
  type InstallmentSchedule,
  type InstallmentScheduleColumn,
} from '~~/shared/utils/installmentSchedule'
import { serviceModeShortLabels } from '~~/shared/utils/planDisplay'

function formatPlanCondition(plan: ProductPlanCardOption) {
  const years = `${plan.contract_years} ปี`
  const mode = serviceModeShortLabels[plan.service_mode]
  if (plan.service_mode === 'none') return `${years} · ${plan.contract_months} งวด`
  return `${years} · ${mode}`
}

/** ตารางผ่อนต่อสินค้า — แต่ละคอลัมน์ = 1 แผนสัญญา (ไม่รวม combo / ตะกร้า) */
export function buildProductInstallmentSchedule(product: Product): InstallmentSchedule | null {
  const plans = product.plans ?? []
  if (!plans.length) return null

  const items: InquiryItem[] = plans.map(plan => planToInquiryItem(product, plan))
  const base = buildInstallmentSchedule(items, null)
  if (!base) return null

  const columns: InstallmentScheduleColumn[] = plans.map((plan, index) => {
    const prev = base.columns[index]!
    return {
      ...prev,
      column_key: plan.id,
      plan_id: plan.id,
      name: plan.contract_label,
      sku: plan.policy_code ? `Policy ${plan.policy_code}` : product.sku,
      contract_condition: formatPlanCondition(plan),
      quantity: 1,
    }
  })

  return {
    ...base,
    columns,
    combo_percent: 0,
    combo_program_name: null,
    promo_headline: null,
  }
}
