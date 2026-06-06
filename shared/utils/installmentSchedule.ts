import type { InquiryItem } from '~~/shared/types/inquiry'
import {
  buildComboQuoteForItem,
  inquiryItemHasAdvance,
  type ComboBillLine,
  type ComboQuoteResult,
} from '~~/shared/utils/comboPricing'
import { cartLineKey, getCartItemQuantity, normalizeCartItems } from '~~/shared/utils/cartQuantity'

export type InstallmentScheduleColumn = {
  /** คีย์ไม่ซ้ำต่อคอลัมน์ (product_id:plan_id) */
  column_key: string
  product_id: string
  plan_id?: string
  name: string
  sku: string
  image_url: string | null
  contract_condition: string
  /** มัดจำรวมทุกชิ้นในคอลัมน์ (ถ้ามี) */
  advance_amount: number | null
  advance_note: string | null
  contract_months: number
  /** จำนวนชิ้นในคอลัมน์นี้ */
  quantity: number
  /** มีมัดจำ → แถววันทำรายการ = มัดจำ · เดือนที่ 1 ยังเป็นบิลแผน 1 */
  has_advance: boolean
}

function itemScheduleKey(item: InquiryItem) {
  return cartLineKey(item)
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
  /** แถวมัดจำ = ชำระวันทำรายการ */
  is_advance: boolean
  /** ไม่มีมัดจำ — งวด 1 ชำระวันทำรายการ (แถวแรก) */
  is_signup_payment: boolean
  /** เดือนที่ 1 ชำระแล้ววันทำรายการ → แสดง — */
  prepaid_at_signup: boolean
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
  is_signup_payment: boolean
  prepaid_at_signup: boolean
}

/** แถวมัดจำ (วันทำรายการ) — แยกจากเดือนที่ 1 ของแผน */
const TRANSACTION_DISPLAY_MONTH = 0

function billSnapshotKey(line: ScheduleBillLine) {
  return `${line.base}|${line.charged}|${line.combo_applied}|${line.is_advance}|${line.is_signup_payment}|${line.prepaid_at_signup}|${line.deferred_discount}|${line.own_discount}`
}

function billsForItem(item: InquiryItem, quote: ComboQuoteResult | null, quoteIndex?: number): ComboBillLine[] {
  if (quote?.per_item.length && quoteIndex != null && quoteIndex >= 0 && quoteIndex < quote.per_item.length) {
    const fromQuote = quote.per_item[quoteIndex]?.bills
    if (fromQuote?.length) return fromQuote
  }
  const fromQuote = quote?.per_item.find(p => p.product_id === item.product_id)?.bills
  if (fromQuote?.length) return fromQuote
  return buildComboQuoteForItem(item, quote?.percent ?? 0).bills
}

/**
 * มีมัดจำ → วันทำรายการ = มัดจำ · เดือนที่ 1,2,… = บิลแผน 1,2,…
 * ไม่มีมัดจำ → วันทำรายการ = งวด 1 · เดือนที่ 1 = — (ชำระแล้ว) · เดือนที่ 2 ขึ้นไปตามแผน/combo
 */
function toDisplayBills(item: InquiryItem, contractBills: ComboBillLine[]): ScheduleBillLine[] {
  const advance = Number(item.advance_amount) || 0
  if (advance <= 0) {
    const bill1 = contractBills.find(b => b.bill === 1)
    const rows: ScheduleBillLine[] = []

    if (bill1) {
      rows.push({
        display_month: TRANSACTION_DISPLAY_MONTH,
        source_bill: 1,
        base: bill1.base,
        charged: bill1.base,
        combo_applied: false,
        deferred_discount: 0,
        own_discount: 0,
        is_advance: false,
        is_signup_payment: true,
        prepaid_at_signup: false,
      })
    }

    for (const b of contractBills) {
      rows.push({
        display_month: b.bill,
        source_bill: b.bill,
        base: b.base,
        charged: b.bill === 1 ? 0 : b.charged,
        combo_applied: b.combo_applied,
        deferred_discount: b.deferred_discount ?? 0,
        own_discount: b.own_discount ?? 0,
        is_advance: false,
        is_signup_payment: false,
        prepaid_at_signup: b.bill === 1,
      })
    }

    return rows
  }

  const rows: ScheduleBillLine[] = [{
    display_month: TRANSACTION_DISPLAY_MONTH,
    source_bill: null,
    base: advance,
    charged: advance,
    combo_applied: false,
    deferred_discount: 0,
    own_discount: 0,
    is_advance: true,
    is_signup_payment: false,
    prepaid_at_signup: false,
  }]

  for (const b of contractBills) {
    rows.push({
      display_month: b.bill,
      source_bill: b.bill,
      base: b.base,
      charged: b.charged,
      combo_applied: b.combo_applied,
      deferred_discount: b.deferred_discount ?? 0,
      own_discount: b.own_discount ?? 0,
      is_advance: false,
      is_signup_payment: false,
      prepaid_at_signup: false,
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

function scheduleHasTransactionRow(
  items: InquiryItem[],
  linesByKey: Map<string, ScheduleBillLine[]>,
) {
  return items.some((item) => {
    const lines = linesByKey.get(itemScheduleKey(item)) ?? []
    return lines.some(l => l.display_month === TRANSACTION_DISPLAY_MONTH)
  })
}

function buildRanges(
  items: InquiryItem[],
  maxDisplayMonth: number,
  linesByKey: Map<string, ScheduleBillLine[]>,
) {
  const ranges: { bill_from: number, bill_to: number }[] = []

  if (scheduleHasTransactionRow(items, linesByKey)) {
    ranges.push({ bill_from: TRANSACTION_DISPLAY_MONTH, bill_to: TRANSACTION_DISPLAY_MONTH })
  }

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

function deriveRowLabel(
  bill_from: number,
  bill_to: number,
): string {
  if (bill_from === TRANSACTION_DISPLAY_MONTH && bill_to === TRANSACTION_DISPLAY_MONTH) {
    return 'วันที่ทำรายการ'
  }

  if (bill_from === bill_to) return `เดือนที่ ${bill_from}`
  return `เดือนที่ ${bill_from} – ${bill_to}`
}

function scaleScheduleLine(line: ScheduleBillLine, quantity: number): ScheduleBillLine {
  if (quantity <= 1) return line
  return {
    ...line,
    base: line.base * quantity,
    charged: line.charged * quantity,
    deferred_discount: line.deferred_discount * quantity,
    own_discount: line.own_discount * quantity,
  }
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
      is_signup_payment: false,
      prepaid_at_signup: false,
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
    is_signup_payment: line.is_signup_payment,
    prepaid_at_signup: line.prepaid_at_signup,
    prepaid_note: line.is_advance || line.is_signup_payment || line.prepaid_at_signup,
    defer_combo_note: line.source_bill === 2 && line.deferred_discount > 0,
  }
}

export function buildInstallmentSchedule(
  items: InquiryItem[],
  quote: ComboQuoteResult | null,
): InstallmentSchedule | null {
  const lines = normalizeCartItems(items)
  if (!lines.length) return null

  const percent = quote?.percent ?? 0
  const linesByKey = new Map<string, ScheduleBillLine[]>()
  let quoteIndex = 0

  for (const item of lines) {
    const qty = getCartItemQuantity(item)
    const unitBills = billsForItem(item, quote, quoteIndex)
    quoteIndex += qty
    const unitDisplay = toDisplayBills(item, unitBills)
    linesByKey.set(
      itemScheduleKey(item),
      unitDisplay.map(line => scaleScheduleLine(line, qty)),
    )
  }

  const maxDisplayMonth = Math.max(
    ...lines.map((item) => {
      const displayLines = linesByKey.get(itemScheduleKey(item)) ?? []
      return displayLines.length ? displayLines[displayLines.length - 1]!.display_month : 0
    }),
  )

  const ranges = buildRanges(lines, maxDisplayMonth, linesByKey)
  const has_advance_shift = lines.some(itemHasAdvance)

  const columns: InstallmentScheduleColumn[] = lines.map((item) => {
    const qty = getCartItemQuantity(item)
    const unitAdvance = item.advance_amount != null ? Number(item.advance_amount) : null
    return {
      column_key: itemScheduleKey(item),
      product_id: item.product_id,
      plan_id: item.plan_id,
      name: item.name,
      sku: item.sku,
      image_url: item.image_url,
      contract_condition: item.contract_label || `${item.contract_years} ปี`,
      advance_amount: unitAdvance != null ? unitAdvance * qty : null,
      advance_note: item.advance_note,
      contract_months: item.contract_months,
      quantity: qty,
      has_advance: itemHasAdvance(item),
    }
  })

  const rows: InstallmentScheduleRow[] = ranges.map(({ bill_from, bill_to }) => {
    const cells = lines.map((item) => {
      const displayLines = linesByKey.get(itemScheduleKey(item)) ?? []
      const line = displayLines.find(l => l.display_month === bill_from)
      return buildCell(line, percent)
    })
    const total_charged = cells.reduce((sum, c) => sum + (c.in_contract ? c.charged : 0), 0)
    return {
      label: deriveRowLabel(bill_from, bill_to),
      bill_from,
      bill_to,
      cells,
      total_charged,
    }
  })

  const promo_headline = percent > 0 && quote?.program_name
    ? `ส่วนลด Combo ${percent}% · ${quote.program_name}`
    : percent > 0
      ? `ส่วนลด Combo ${percent}% ตลอดสัญญา (ตามบิลแผน${has_advance_shift ? ' — วันทำรายการ = มัดจำ · เดือนที่ 1 = บิล 1' : ' — วันทำรายการ = งวด 1 · เดือนที่ 1 ไม่ต้องชำระ'})`
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
