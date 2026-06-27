import type { InquiryItem } from '../types/inquiry'
import type { ProductPlan, ProductPlanCardOption, ServiceMode } from '~~/shared/types/productPlan'

export const SERVICE_MODE_ORDER: ServiceMode[] = ['visit', 'self', 'none']

export const serviceModeLabels: Record<ServiceMode, string> = {
  visit: 'Visit (ช่างเข้าบ้าน)',
  self: 'Self (ส่งอะไหล่)',
  none: 'ไม่มีบริการตามสัญญา',
}

/** ป้ายสั้นสำหรับปุ่มเลือกบนการ์ด */
export const serviceModeShortLabels: Record<ServiceMode, string> = {
  visit: 'Visit',
  self: 'Self',
  none: 'ไม่มีบริการ',
}

/** แสดงรอบบริการได้เฉพาะ Visit / Self — No service ไม่มีรอบบริการ */
export function planShowsServiceInterval(
  plan: Pick<ProductPlan, 'service_mode' | 'service_interval_months'>,
) {
  return plan.service_mode !== 'none'
    && plan.service_interval_months != null
    && plan.service_interval_months > 0
}

export function normalizePlanServiceInterval(
  serviceMode: ServiceMode,
  serviceIntervalMonths: number | null | undefined,
): number | null {
  if (serviceMode === 'none') return null
  if (serviceIntervalMonths == null || serviceIntervalMonths < 1) return null
  return serviceIntervalMonths
}

export function comparePlansForDisplay<
  T extends Pick<ProductPlan, 'sort_order' | 'created_at' | 'is_default'>,
>(
  a: T,
  b: T,
): number {
  if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
  const sortDiff = a.sort_order - b.sort_order
  if (sortDiff !== 0) return sortDiff
  return a.created_at.localeCompare(b.created_at)
}

/** แผนที่แสดงบนหน้าร้าน — ทุกแผน active (เรียงตาม sort_order) */
export function pickStorefrontPlans(plans: ProductPlan[]): ProductPlan[] {
  return [...plans].sort(comparePlansForDisplay)
}

export function plansForYearAndMode<T extends Pick<ProductPlanCardOption, 'contract_years' | 'service_mode' | 'is_default' | 'sort_order' | 'service_interval_months'>>(
  plans: T[],
  contractYears: number,
  serviceMode: ServiceMode,
): T[] {
  return plans
    .filter(p => p.contract_years === contractYears && p.service_mode === serviceMode)
    .sort((a, b) => {
      if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
      const intervalA = a.service_interval_months ?? 9999
      const intervalB = b.service_interval_months ?? 9999
      if (intervalA !== intervalB) return intervalA - intervalB
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })
}

/** รอบบริการที่เลือกได้ (Visit/Self) เมื่อปี+โหมดเดียวกันมีหลายแผน */
export function availableServiceIntervals(
  plans: ProductPlanCardOption[],
  contractYears: number,
  serviceMode: ServiceMode,
): number[] {
  if (serviceMode === 'none') return []
  const intervals = plansForYearAndMode(plans, contractYears, serviceMode)
    .map(p => p.service_interval_months)
    .filter((n): n is number => n != null && n > 0)
  return [...new Set(intervals)].sort((a, b) => a - b)
}

export function serviceIntervalLabel(months: number) {
  return `ทุก ${months} เดือน`
}

export function findPlanByYearModeAndInterval(
  plans: ProductPlanCardOption[],
  contractYears: number,
  serviceMode: ServiceMode,
  serviceIntervalMonths: number,
): ProductPlanCardOption | undefined {
  return plansForYearAndMode(plans, contractYears, serviceMode)
    .find(p => p.service_interval_months === serviceIntervalMonths)
}

/** ป้ายเลือกแผนเมื่อมีหลายแผนปี/บริการเดียวกัน (เช่น 5Y สองโปร / รอบบริการต่างกัน) */
export function planVariantOptionLabel(plan: ProductPlanCardOption): string {
  if (planShowsServiceInterval(plan)) {
    return serviceIntervalLabel(plan.service_interval_months!)
  }
  const note = plan.display_price_note?.trim()
  if (note) return note
  const advance = plan.advance_note?.trim()
  if (advance) return advance
  const policy = plan.policy_code?.trim()
  if (policy) return policy
  if (plan.display_monthly_price != null) {
    return `${plan.display_monthly_price.toLocaleString('th-TH')} บ./เดือน`
  }
  return plan.contract_label
}

/** เงื่อนไขสัญญาสั้น — ตารางผ่อน / สรุปรายการ */
export function formatContractCondition(
  input: Pick<ProductPlan, 'contract_years' | 'contract_months' | 'service_mode' | 'service_interval_months'>,
): string {
  const years = `${input.contract_years} ปี`
  const mode = serviceModeShortLabels[input.service_mode]
  if (input.service_mode === 'none') return `${years} · ${input.contract_months} งวด`
  if (planShowsServiceInterval(input)) {
    return `${years} · ${mode} · ${serviceIntervalLabel(input.service_interval_months!)}`
  }
  return `${years} · ${mode}`
}

/** บรรทัดสัญญาในตะกร้า / หน้าส่งคำขอ */
export function inquiryItemContractLine(
  item: Pick<InquiryItem, 'contract_label' | 'contract_years' | 'contract_months' | 'service_mode' | 'service_interval_months'>,
): string {
  const label = item.contract_label?.trim()
  if (!label) return formatContractCondition(item)
  if (planShowsServiceInterval(item)) {
    return `${label} · ${serviceIntervalLabel(item.service_interval_months!)}`
  }
  return label
}

/** สรุปสัญญาเต็ม — Line / export / แอดมิน */
export function formatInquiryContractSummary(
  item: Pick<InquiryItem, 'contract_label' | 'contract_years' | 'contract_months' | 'service_mode' | 'service_interval_months'>,
): string {
  const mode = serviceModeLabels[item.service_mode]
  const parts = [
    item.contract_label,
    `${item.contract_years} ปี`,
    `${item.contract_months} บิล`,
    mode,
  ]
  if (planShowsServiceInterval(item)) {
    parts.push(serviceIntervalLabel(item.service_interval_months!))
  }
  return parts.filter(Boolean).join(' · ')
}

export function availableContractYears(plans: ProductPlanCardOption[]): number[] {
  return [...new Set(plans.map(p => p.contract_years))].sort((a, b) => a - b)
}

export function availableServiceModes(
  plans: ProductPlanCardOption[],
  contractYears: number,
): ServiceMode[] {
  const modes = new Set(
    plans.filter(p => p.contract_years === contractYears).map(p => p.service_mode),
  )
  return SERVICE_MODE_ORDER.filter(m => modes.has(m))
}

export function findPlanByYearAndMode(
  plans: ProductPlanCardOption[],
  contractYears: number,
  serviceMode: ServiceMode,
): ProductPlanCardOption | undefined {
  return plansForYearAndMode(plans, contractYears, serviceMode)[0]
}

export function pickInitialPlanSelection(
  plans: ProductPlanCardOption[],
  preferredPlanId?: string | null,
): { years: number, mode: ServiceMode, plan: ProductPlanCardOption } | null {
  if (!plans.length) return null

  let plan = preferredPlanId ? plans.find(p => p.id === preferredPlanId) : undefined
  if (!plan) plan = plans.find(p => p.is_default) ?? plans[0]

  return {
    years: plan!.contract_years,
    mode: plan!.service_mode,
    plan: plan!,
  }
}

export function planContractTitle(
  plan: Pick<ProductPlan, 'contract_label' | 'contract_years' | 'service_mode' | 'service_interval_months'>,
) {
  const mode = serviceModeLabels[plan.service_mode]
  let title = `${plan.contract_label} · ${plan.contract_years} ปี · ${mode}`
  if (planShowsServiceInterval(plan)) {
    title += ` · ${serviceIntervalLabel(plan.service_interval_months!)}`
  }
  return title
}
