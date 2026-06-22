import type { ComboCustomerSegment, ComboProgramTier, ComboTierMode } from '~~/shared/types/comboProgram'
import type { InquiryItem } from '~~/shared/types/inquiry'
import { expandInquiryItemsByQuantity } from '~~/shared/utils/cartQuantity'
import { COMBO_EFFECTIVE_FROM_BILL, formatTierRange } from '~~/shared/utils/comboProgramDisplay'
import { monthlyPriceAtBill } from '~~/shared/utils/planPricing'

export type ComboTierPick = {
  min_items: number
  max_items: number | null
  extra_discount_percent: number
  sort_order?: number
}

export type ComboTimelineStep = {
  min_items: number
  max_items: number | null
  extra_discount_percent: number
  label: string
}

export type ComboBillLine = {
  bill: number
  base: number
  charged: number
  combo_applied: boolean
  /** ส่วนลดจาก % ของงวดที่ 1 ที่หักในงวดนี้ (งวด 2 เท่านั้น) */
  deferred_discount?: number
  /** ส่วนลด % ของ base งวดนี้ */
  own_discount?: number
}

export type ComboItemQuote = {
  product_id: string
  name: string
  bills: ComboBillLine[]
  contract_total_base: number
  contract_total_charged: number
  savings: number
}

export type ComboQuoteResult = {
  segment: ComboCustomerSegment
  item_count: number
  percent: number
  tier: ComboTierPick | null
  program_id: string | null
  program_name: string | null
  per_item: ComboItemQuote[]
  order_total_base: number
  order_total_charged: number
  savings: number
}

export type ComboBillLineDetail = {
  product_id: string
  name: string
  base: number
  charged: number
  combo_applied: boolean
  deferred_discount?: number
  own_discount?: number
}

export type ComboBillTotalsSummary = {
  bill: number
  total_base: number
  total_charged: number
  savings: number
  total_deferred_discount: number
  total_own_discount: number
  lines: ComboBillLineDetail[]
  has_data: boolean
}

export type ComboProgramForQuote = {
  id: string
  name: string
  customer_segment: ComboCustomerSegment
  tier_mode?: ComboTierMode
  tiers: ComboProgramTier[]
}

/** เลือกชั้นที่ใช้จริง — จำนวนชิ้น ≥ min_items สูงสุดที่เข้าเงื่อนไข (ไม่ใช้ max_items กรอง) */
export function pickComboTier(
  tiers: ComboTierPick[],
  itemCount: number,
): ComboTierPick | null {
  if (!tiers.length || itemCount < 1) return null

  const sorted = [...tiers].sort((a, b) => b.min_items - a.min_items)
  for (const tier of sorted) {
    if (itemCount >= tier.min_items) return tier
  }
  return null
}

export function pickComboPercent(tiers: ComboTierPick[], itemCount: number): number {
  return pickComboTier(tiers, itemCount)?.extra_discount_percent ?? 0
}

export function inquiryItemHasAdvance(item: Pick<InquiryItem, 'advance_amount'>): boolean {
  return (Number(item.advance_amount) || 0) > 0
}

/**
 * งวด 1 = จ่ายเต็ม
 * งวด 2 = หัก (pct% ของงวด 1) + (pct% ของงวด 2) เป็นส่วนลดในงวดนี้
 * งวด 3+ = หัก pct% ของงวดนั้น
 */
export function computeComboChargedForBill(
  bill: number,
  base: number,
  percent: number,
  bill1Base: number,
  effectiveFromBill = COMBO_EFFECTIVE_FROM_BILL,
): Pick<ComboBillLine, 'charged' | 'combo_applied' | 'deferred_discount' | 'own_discount'> {
  if (percent <= 0 || bill < effectiveFromBill) {
    return { charged: base, combo_applied: false }
  }

  if (bill === effectiveFromBill) {
    const deferred_discount = bill1Base * percent / 100
    const own_discount = base * percent / 100
    const charged = Math.max(0, base - deferred_discount - own_discount)
    return {
      charged,
      combo_applied: true,
      deferred_discount,
      own_discount,
    }
  }

  const own_discount = base * percent / 100
  const charged = Math.max(0, base - own_discount)
  return { charged, combo_applied: true, own_discount }
}

export function buildComboTimelineSteps(
  tiers: ComboTierPick[],
  tierMode: ComboTierMode = 'stepped',
): ComboTimelineStep[] {
  return [...tiers]
    .sort((a, b) => a.min_items - b.min_items || (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(t => ({
      min_items: t.min_items,
      max_items: t.max_items,
      extra_discount_percent: Number(t.extra_discount_percent),
      label: formatTierRange(t.min_items, t.max_items, tierMode),
    }))
}

export function buildComboQuoteForItem(
  item: InquiryItem,
  percent: number,
  effectiveFromBill = COMBO_EFFECTIVE_FROM_BILL,
): ComboItemQuote {
  const bills: ComboBillLine[] = []
  let contract_total_base = 0
  let contract_total_charged = 0

  const bill1Base = monthlyPriceAtBill(item.billing_tiers, 1) ?? 0

  for (let bill = 1; bill <= item.contract_months; bill++) {
    const base = monthlyPriceAtBill(item.billing_tiers, bill) ?? 0
    const { charged, combo_applied, deferred_discount, own_discount } = computeComboChargedForBill(
      bill,
      base,
      percent,
      bill1Base,
      effectiveFromBill,
    )

    bills.push({ bill, base, charged, combo_applied, deferred_discount, own_discount })
    contract_total_base += base
    contract_total_charged += charged
  }

  return {
    product_id: item.product_id,
    name: item.name,
    bills,
    contract_total_base,
    contract_total_charged,
    savings: contract_total_base - contract_total_charged,
  }
}

export function buildComboQuote(
  items: InquiryItem[],
  program: ComboProgramForQuote | null,
  segment: ComboCustomerSegment,
): ComboQuoteResult {
  const expanded = expandInquiryItemsByQuantity(items)
  const item_count = expanded.length
  const tierRows: ComboTierPick[] = (program?.tiers ?? []).map(t => ({
    min_items: t.min_items,
    max_items: t.max_items,
    extra_discount_percent: Number(t.extra_discount_percent),
    sort_order: t.sort_order,
  }))
  const tier = pickComboTier(tierRows, item_count)
  const percent = tier?.extra_discount_percent ?? 0

  const per_item = expanded.map(item => buildComboQuoteForItem(item, percent))
  const order_total_base = per_item.reduce((s, i) => s + i.contract_total_base, 0)
  const order_total_charged = per_item.reduce((s, i) => s + i.contract_total_charged, 0)

  return {
    segment,
    item_count,
    percent,
    tier: tier
      ? {
          min_items: tier.min_items,
          max_items: tier.max_items,
          extra_discount_percent: tier.extra_discount_percent,
        }
      : null,
    program_id: program?.id ?? null,
    program_name: program?.name ?? null,
    per_item,
    order_total_base,
    order_total_charged,
    savings: order_total_base - order_total_charged,
  }
}

/** ชั้นถัดไปที่ลูกค้าจะได้ถ้าเพิ่มสินค้า */
export function nextComboTierHint(
  tiers: ComboTierPick[],
  currentCount: number,
): { items_needed: number, percent: number, extra_percent: number, label: string } | null {
  const sorted = [...tiers].sort((a, b) => a.min_items - b.min_items)
  const next = sorted.find(t => t.min_items > currentCount)
  if (!next) return null
  const currentPercent = pickComboPercent(tiers, currentCount)
  const nextPercent = Number(next.extra_discount_percent)
  return {
    items_needed: next.min_items - currentCount,
    percent: nextPercent,
    extra_percent: Math.max(0, nextPercent - currentPercent),
    label: formatTierRange(next.min_items, next.max_items, 'stepped'),
  }
}

/** ไฮไลต์เฉพาะชั้นที่ระบบเลือกใช้จริง */
export function isTimelineStepActive(
  step: ComboTimelineStep,
  itemCount: number,
  appliedTier?: ComboTierPick | null,
): boolean {
  if (itemCount < 1 || !appliedTier) return false
  return step.min_items === appliedTier.min_items
    && Number(step.extra_discount_percent) === Number(appliedTier.extra_discount_percent)
}

/** @deprecated ใช้ isTimelineStepActive พร้อม appliedTier แทน */
export function isTimelineStepInRange(
  step: ComboTimelineStep,
  itemCount: number,
): boolean {
  if (itemCount < step.min_items) return false
  if (step.max_items != null && itemCount > step.max_items) return false
  return true
}

/** รวมยอดค่างวดของบิลที่กำหนดทุกรายการในคำสั่ง */
export function summarizeComboBillTotals(
  quote: ComboQuoteResult,
  bill: number,
): ComboBillTotalsSummary {
  const lines: ComboBillLineDetail[] = []

  for (const item of quote.per_item) {
    const row = item.bills.find(b => b.bill === bill)
    if (!row) continue
    lines.push({
      product_id: item.product_id,
      name: item.name,
      base: row.base,
      charged: row.charged,
      combo_applied: row.combo_applied,
      deferred_discount: row.deferred_discount,
      own_discount: row.own_discount,
    })
  }

  const total_base = lines.reduce((s, l) => s + l.base, 0)
  const total_charged = lines.reduce((s, l) => s + l.charged, 0)
  const total_deferred_discount = lines.reduce((s, l) => s + (l.deferred_discount ?? 0), 0)
  const total_own_discount = lines.reduce((s, l) => s + (l.own_discount ?? 0), 0)

  return {
    bill,
    total_base,
    total_charged,
    savings: total_base - total_charged,
    total_deferred_discount,
    total_own_discount,
    lines,
    has_data: lines.length > 0,
  }
}
