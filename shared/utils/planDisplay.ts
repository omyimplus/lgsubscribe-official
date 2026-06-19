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

export function todayDateString(date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
}

export type PlanPromoPeriod = Pick<ProductPlan, 'promo_period_start' | 'promo_period_end'>

export function planHasPromoPeriod(plan: PlanPromoPeriod): boolean {
  return Boolean(plan.promo_period_start || plan.promo_period_end)
}

function planPromoBounds(plan: PlanPromoPeriod): { start: string, end: string } {
  return {
    start: plan.promo_period_start ?? '0000-01-01',
    end: plan.promo_period_end ?? '9999-12-31',
  }
}

/** วันนี้อยู่ในช่วงโปรที่กำหนด (แผนที่ไม่มีช่วงโปร = false) */
export function isPlanPromoActiveToday(
  plan: PlanPromoPeriod,
  todayStr = todayDateString(),
): boolean {
  if (!planHasPromoPeriod(plan)) return false
  const { start, end } = planPromoBounds(plan)
  return todayStr >= start && todayStr <= end
}

/** แผนที่ควรแสดงบนหน้าร้านวันนี้ — แผนปกติตลอด · แผนโปรเฉพาะช่วงที่ยังมีผล */
export function isPlanEligibleForStorefront(
  plan: PlanPromoPeriod,
  todayStr = todayDateString(),
): boolean {
  if (!planHasPromoPeriod(plan)) return true
  return isPlanPromoActiveToday(plan, todayStr)
}

export function formatPlanPromoPeriod(plan: PlanPromoPeriod): string | null {
  if (!planHasPromoPeriod(plan)) return null
  return [plan.promo_period_start, plan.promo_period_end].filter(Boolean).join(' – ')
}

/** 0 = โปรที่มีผลวันนี้, 1 = แผนปกติ (ไม่มีช่วงโปร), 2 = โปรนอกช่วง */
export function planPromoRank(
  plan: PlanPromoPeriod,
  todayStr: string,
): number {
  if (!planHasPromoPeriod(plan)) return 1

  const { start, end } = planPromoBounds(plan)
  if (todayStr >= start && todayStr <= end) return 0
  return 2
}

export function comparePlansForDisplay<
  T extends Pick<ProductPlan, 'sort_order' | 'created_at' | 'promo_period_start' | 'promo_period_end' | 'is_default'>,
>(
  a: T,
  b: T,
  todayStr = todayDateString(),
): number {
  const rankDiff = planPromoRank(a, todayStr) - planPromoRank(b, todayStr)
  if (rankDiff !== 0) return rankDiff
  if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
  const sortDiff = a.sort_order - b.sort_order
  if (sortDiff !== 0) return sortDiff
  return a.created_at.localeCompare(b.created_at)
}

/** เลือกแผนเดียวต่อ (ปี, service_mode) สำหรับหน้าร้าน */
export function pickStorefrontPlans(plans: ProductPlan[], today = new Date()): ProductPlan[] {
  const todayStr = todayDateString(today)
  const groups = new Map<string, ProductPlan[]>()

  for (const plan of plans) {
    const key = `${plan.contract_years}:${plan.service_mode}`
    const list = groups.get(key) ?? []
    list.push(plan)
    groups.set(key, list)
  }

  return [...groups.values()]
    .map((group) => {
      const eligible = group.filter(p => isPlanEligibleForStorefront(p, todayStr))
      if (!eligible.length) return null
      return [...eligible].sort((a, b) => comparePlansForDisplay(a, b, todayStr))[0]!
    })
    .filter((plan): plan is ProductPlan => plan != null)
    .sort((a, b) => comparePlansForDisplay(a, b, todayStr))
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
  const matches = plans.filter(p => p.contract_years === contractYears && p.service_mode === serviceMode)
  if (!matches.length) return undefined
  return [...matches].sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })[0]
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

export function planContractTitle(plan: Pick<ProductPlan, 'contract_label' | 'contract_years' | 'service_mode'>) {
  const mode = serviceModeLabels[plan.service_mode]
  return `${plan.contract_label} · ${plan.contract_years} ปี · ${mode}`
}
