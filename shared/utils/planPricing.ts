import type { PlanBillingTier, ProductPlanPricingSummary } from '~~/shared/types/productPlan'

export function tierBillCount(tier: Pick<PlanBillingTier, 'bill_from' | 'bill_to'>): number {
  return tier.bill_to - tier.bill_from + 1
}

export function totalContractAmount(
  tiers: Pick<PlanBillingTier, 'bill_from' | 'bill_to' | 'monthly_price'>[],
): number {
  return tiers.reduce((sum, tier) => sum + tierBillCount(tier) * Number(tier.monthly_price), 0)
}

export function totalNetAmount(contractTotal: number, advanceAmount?: number | null): number {
  return contractTotal + (Number(advanceAmount) || 0)
}

/** ราคา/เดือนบนการ์ด PLP — ตรงกับ `useProductPlanPricing.cardMonthlyPrice` */
export function cardMonthlyPriceForListing(
  pricing: ProductPlanPricingSummary | null | undefined,
): number | null {
  if (!pricing) return null
  if (pricing.plan_count > 1 && pricing.from_monthly_price != null) {
    return pricing.from_monthly_price
  }
  return pricing.display_monthly_price
}

export function displayPriceForCard(
  tiers: Pick<PlanBillingTier, 'bill_from' | 'bill_to' | 'monthly_price' | 'sort_order'>[],
): number | null {
  if (!tiers.length) return null
  const sorted = [...tiers].sort((a, b) => a.sort_order - b.sort_order || a.bill_from - b.bill_from)
  return Number(sorted[0]!.monthly_price)
}

export function monthlyPriceAtBill(
  tiers: Pick<PlanBillingTier, 'bill_from' | 'bill_to' | 'monthly_price' | 'sort_order'>[],
  billNumber: number,
): number | null {
  const sorted = [...tiers].sort((a, b) => a.sort_order - b.sort_order || a.bill_from - b.bill_from)
  for (const tier of sorted) {
    if (billNumber >= tier.bill_from && billNumber <= tier.bill_to) {
      return Number(tier.monthly_price)
    }
  }
  return null
}

export function displayPriceNote(
  tiers: Pick<PlanBillingTier, 'bill_from' | 'bill_to' | 'monthly_price' | 'note' | 'sort_order'>[],
): string | null {
  if (!tiers.length) return null
  const sorted = [...tiers].sort((a, b) => a.sort_order - b.sort_order || a.bill_from - b.bill_from)
  const first = sorted[0]!
  if (first.note?.trim()) return first.note.trim()
  const count = tierBillCount(first)
  return `${Number(first.monthly_price).toLocaleString('th-TH')} บ./เดือน (${count} บิลแรก)`
}

export type TiersValidationResult = { ok: true } | { ok: false, message: string }

export function validateTiersContinuity(
  tiers: Pick<PlanBillingTier, 'bill_from' | 'bill_to' | 'monthly_price'>[],
  contractMonths: number,
): TiersValidationResult {
  if (!tiers.length) {
    return { ok: false, message: 'ต้องมีอย่างน้อย 1 ช่วงบิล' }
  }

  const sorted = [...tiers].sort((a, b) => a.bill_from - b.bill_from)

  if (sorted[0]!.bill_from !== 1) {
    return { ok: false, message: 'ช่วงบิลแรกต้องเริ่มที่บิล 1' }
  }

  for (let i = 0; i < sorted.length; i++) {
    const tier = sorted[i]!
    if (tier.bill_from > tier.bill_to) {
      return { ok: false, message: `ช่วงบิลลำดับ ${i + 1} กรอกไม่ถูกต้อง: บิลเริ่มต้องน้อยกว่าหรือเท่ากับบิลสิ้นสุด` }
    }
    if (Number(tier.monthly_price) < 0) {
      return { ok: false, message: `ช่วงบิลลำดับ ${i + 1} กรอกไม่ถูกต้อง: ราคาต่อเดือนไม่สามารถติดลบได้` }
    }
    if (i > 0 && sorted[i - 1]!.bill_to + 1 !== tier.bill_from) {
      return { ok: false, message: 'ช่วงบิลต้องต่อเนื่องกัน (ห้ามขาดช่วงหรือทับซ้อน)' }
    }
  }

  if (sorted[sorted.length - 1]!.bill_to !== contractMonths) {
    return { ok: false, message: `ช่วงบิลสุดท้ายต้องสิ้นสุดที่บิล ${contractMonths} (contract_months)` }
  }

  return { ok: true }
}
