import type { InquiryItem } from '~~/shared/types/inquiry'
import {
  buildComboQuoteForItem,
  inquiryItemHasAdvance,
  type ComboBillLine,
  type ComboQuoteResult,
} from '~~/shared/utils/comboPricing'

export type InstallmentScheduleColumn = {
  /** คีย์ไม่ซ้ำต่อคอลัมน์ (plan_id หรือ product_id) */
  column_key: string
  product_id: string
  plan_id?: string
  name: string
  sku: string
  image_url: string | null
  contract_condition: string
  advance_amount: number | null
  advance_note: string | null
  contract_months: number
  /** มีมัดจำ → งวดที่ 1 ในตาราง = มัดจำ */
  has_advance: boolean
}

function itemScheduleKey(item: InquiryItem) {
  return item.plan_id || item.product_id
}

const itemHasAdvance = inquiryItemHasAdvance

export type InstallmentScheduleCell = {
  in_contract: boolean
  /** เดือนที่แสดงในตาราง (งวดที่) */
  display_month: number
  /** บิลจริงจากแผน/combo (null = แถวมัดจำ) */
  source_bill: number | null
  base: number
  charged: number
  combo_applied: boolean
  percent: number
  deferred_discount: number
  own_discount: number
  /** แถวมัดจำ = ชำระงวดที่ 1 */
  is_advance: boolean
  /** @deprecated ใช้ is_advance */
  bill_number: number
  prepaid_note: boolean
  defer_combo_note: boolean
}

export type InstallmentScheduleRow = {
  label: string
  /** เดือนที่แสดง (ต้น–ปลายแถว) */
  bill_from: number
  bill_to: number
  cells: InstallmentScheduleCell[]
  total_charged: number
}

export type InstallmentSchedule = {
  columns: InstallmentScheduleColumn[]
  rows: InstallmentScheduleRow[]
  combo_percent: number
  combo_program_name: string | null
  promo_headline: string | null
  /** มีอย่างน้อย 1 รายการที่มัดจำนับเป็นงวด 1 */
  has_advance_shift: boolean
}

type ScheduleBillLine = {
  display_month: number
  source_bill: number | null
  base: number
  charged: number
  combo_applied: boolean
  deferred_discount: number
  own_discount: number
  is_advance: boolean
}

function billSnapshotKey(line: ScheduleBillLine) {
  return `${line.base}|${line.charged}|${line.combo_applied}|${line.is_advance}|${line.deferred_discount}|${line.own_discount}`
}

function billsForItem(item: InquiryItem, quote: ComboQuoteResult | null): ComboBillLine[] {
  const fromQuote = quote?.per_item.find(p => p.product_id === item.product_id)?.bills
  if (fromQuote?.length) return fromQuote
  return buildComboQuoteForItem(item, quote?.percent ?? 0).bills
}

/**
 * มีมัดจำ → งวดที่ 1 = มัดจำ · งวดที่ 2 ขึ้นไป = บิลแผน 2,3,… (ไม่แสดงบิล 1 — มัดจำแทนงวดแรกแล้ว)
 */
function toDisplayBills(item: InquiryItem, contractBills: ComboBillLine[]): ScheduleBillLine[] {
  const advance = Number(item.advance_amount) || 0
  if (advance <= 0) {
    return contractBills.map(b => ({
      display_month: b.bill,
      source_bill: b.bill,
      base: b.base,
      charged: b.charged,
      combo_applied: b.combo_applied,
      deferred_discount: b.deferred_discount ?? 0,
      own_discount: b.own_discount ?? 0,
      is_advance: false,
    }))
  }

  const rows: ScheduleBillLine[] = [{
    display_month: 1,
    source_bill: null,
    base: advance,
    charged: advance,
    combo_applied: false,
    deferred_discount: 0,
    own_discount: 0,
    is_advance: true,
  }]

  for (const b of contractBills) {
    if (b.bill === 1) continue
    rows.push({
      display_month: b.bill,
      source_bill: b.bill,
      base: b.base,
      charged: b.charged,
      combo_applied: b.combo_applied,
      deferred_discount: b.deferred_discount ?? 0,
      own_discount: b.own_discount ?? 0,
      is_advance: false,
    })
  }

  return rows
}

function sameDisplayPattern(
  items: InquiryItem[],
  linesByKey: Map<string, ScheduleBillLine[]>,
  displayA: number,
  displayB: number,
): boolean {
  for (const item of items) {
    const lines = linesByKey.get(itemScheduleKey(item)) ?? []
    const a = lines.find(l => l.display_month === displayA)
    const b = lines.find(l => l.display_month === displayB)
    if (!a && !b) continue
    if (!a || !b) return false
    if (billSnapshotKey(a) !== billSnapshotKey(b)) return false
  }
  return true
}

function buildRanges(
  items: InquiryItem[],
  maxDisplayMonth: number,
  linesByKey: Map<string, ScheduleBillLine[]>,
) {
  const ranges: { bill_from: number, bill_to: number }[] = []
  if (maxDisplayMonth < 1) return ranges

  let from = 1
  for (let month = 2; month <= maxDisplayMonth; month++) {
    if (!sameDisplayPattern(items, linesByKey, from, month)) {
      ranges.push({ bill_from: from, bill_to: month - 1 })
      from = month
    }
  }
  ranges.push({ bill_from: from, bill_to: maxDisplayMonth })
  return ranges
}

function rowLabel(bill_from: number, bill_to: number) {
  if (bill_from === bill_to) return `เดือนที่ ${bill_from}`
  return `เดือนที่ ${bill_from} – ${bill_to}`
}

function buildCell(
  line: ScheduleBillLine | undefined,
  percent: number,
): InstallmentScheduleCell {
  if (!line) {
    return {
      in_contract: false,
      display_month: 0,
      source_bill: null,
      bill_number: 0,
      base: 0,
      charged: 0,
      combo_applied: false,
      percent,
      deferred_discount: 0,
      own_discount: 0,
      is_advance: false,
      prepaid_note: false,
      defer_combo_note: false,
    }
  }

  const sourceBill = line.source_bill ?? 0
  return {
    in_contract: true,
    display_month: line.display_month,
    source_bill: line.source_bill,
    bill_number: sourceBill,
    base: line.base,
    charged: line.charged,
    combo_applied: line.combo_applied,
    percent,
    deferred_discount: line.deferred_discount,
    own_discount: line.own_discount,
    is_advance: line.is_advance,
    prepaid_note: line.is_advance,
    defer_combo_note: line.source_bill === 2 && line.deferred_discount > 0,
  }
}

export function buildInstallmentSchedule(
  items: InquiryItem[],
  quote: ComboQuoteResult | null,
): InstallmentSchedule | null {
  if (!items.length) return null

  const percent = quote?.percent ?? 0
  const linesByKey = new Map<string, ScheduleBillLine[]>()

  for (const item of items) {
    linesByKey.set(
      itemScheduleKey(item),
      toDisplayBills(item, billsForItem(item, quote)),
    )
  }

  const maxDisplayMonth = Math.max(
    ...items.map((item) => {
      const lines = linesByKey.get(itemScheduleKey(item)) ?? []
      return lines.length ? lines[lines.length - 1]!.display_month : 0
    }),
  )

  const ranges = buildRanges(items, maxDisplayMonth, linesByKey)
  const has_advance_shift = items.some(itemHasAdvance)

  const columns: InstallmentScheduleColumn[] = items.map(item => ({
    column_key: itemScheduleKey(item),
    product_id: item.product_id,
    plan_id: item.plan_id,
    name: item.name,
    sku: item.sku,
    image_url: item.image_url,
    contract_condition: item.contract_label || `${item.contract_years} ปี`,
    advance_amount: item.advance_amount != null ? Number(item.advance_amount) : null,
    advance_note: item.advance_note,
    contract_months: item.contract_months,
    has_advance: itemHasAdvance(item),
  }))

  const rows: InstallmentScheduleRow[] = ranges.map(({ bill_from, bill_to }) => {
    const cells = items.map((item) => {
      const lines = linesByKey.get(itemScheduleKey(item)) ?? []
      const line = lines.find(l => l.display_month === bill_from)
      return buildCell(line, percent)
    })
    const total_charged = cells.reduce((sum, c) => sum + (c.in_contract ? c.charged : 0), 0)
    return {
      label: rowLabel(bill_from, bill_to),
      bill_from,
      bill_to,
      cells,
      total_charged,
    }
  })

  const promo_headline = percent > 0 && quote?.program_name
    ? `ส่วนลด Combo ${percent}% · ${quote.program_name}`
    : percent > 0
      ? `ส่วนลด Combo ${percent}% ตลอดสัญญา (ตามบิลแผน${has_advance_shift ? ' — มีมัดจำ: งวด 1 = มัดจำ' : ' ตั้งแต่บิลที่ 2'})`
      : null

  return {
    columns,
    rows,
    combo_percent: percent,
    combo_program_name: quote?.program_name ?? null,
    promo_headline,
    has_advance_shift,
  }
}
