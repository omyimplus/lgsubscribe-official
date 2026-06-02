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
  return plans.find(p => p.contract_years === contractYears && p.service_mode === serviceMode)
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
