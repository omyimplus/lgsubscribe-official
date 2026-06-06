import type { InquiryItem } from '~~/shared/types/inquiry'
import { getCartItemQuantity } from '~~/shared/utils/cartQuantity'

export type DueTodayLine = {
  id: string
  label: string
  amount: number
  note?: string | null
}

export type DueTodayItemBreakdown = {
  product_id: string
  name: string
  lines: DueTodayLine[]
  total: number
}

export type DueTodaySummary = {
  items: DueTodayItemBreakdown[]
  aggregateLines: DueTodayLine[]
  total: number
}

export type DueTodayItemInput = Pick<
  InquiryItem,
  | 'product_id'
  | 'name'
  | 'advance_amount'
  | 'advance_note'
  | 'display_monthly_price'
  | 'display_price_note'
  | 'quantity'
>

/** ยอดที่ลูกค้ามักต้องชำระเมื่อเริ่มสัญญา = มัดจำ (ถ้ามี) + ค่างวดบิลที่ 1 */
export function dueTodayLinesForItem(item: DueTodayItemInput): DueTodayLine[] {
  const lines: DueTodayLine[] = []
  const advance = Number(item.advance_amount) || 0

  if (advance > 0) {
    lines.push({
      id: 'advance',
      label: 'มัดจำล่วงหน้า',
      amount: advance,
      note: item.advance_note,
    })
  }

  const firstBill = Number(item.display_monthly_price) || 0
  lines.push({
    id: 'first-bill',
    label: 'ค่างวดเดือนแรก (บิลที่ 1)',
    amount: firstBill,
    note: item.display_price_note,
  })

  return lines
}

export function dueTodayTotalForItem(item: DueTodayItemInput): number {
  return dueTodayLinesForItem(item).reduce((sum, line) => sum + line.amount, 0)
}

export function buildDueTodaySummary(items: DueTodayItemInput[]): DueTodaySummary {
  const breakdowns: DueTodayItemBreakdown[] = items.map((item) => {
    const qty = getCartItemQuantity(item)
    const lines = dueTodayLinesForItem(item).map(line => ({
      ...line,
      amount: line.amount * qty,
      label: qty > 1 ? `${line.label} (×${qty})` : line.label,
    }))
    return {
      product_id: item.product_id,
      name: qty > 1 ? `${item.name} (×${qty})` : item.name,
      lines,
      total: lines.reduce((sum, line) => sum + line.amount, 0),
    }
  })

  const totalAdvance = items.reduce(
    (sum, i) => sum + (Number(i.advance_amount) || 0) * getCartItemQuantity(i),
    0,
  )
  const totalFirstBill = items.reduce(
    (sum, i) => sum + (Number(i.display_monthly_price) || 0) * getCartItemQuantity(i),
    0,
  )
  const totalPieces = items.reduce((sum, i) => sum + getCartItemQuantity(i), 0)
  const multi = items.length > 1 || totalPieces > 1

  const aggregateLines: DueTodayLine[] = []
  if (totalAdvance > 0) {
    aggregateLines.push({
      id: 'advance-total',
      label: multi ? 'มัดจำล่วงหน้า (รวม)' : 'มัดจำล่วงหน้า',
      amount: totalAdvance,
    })
  }
  aggregateLines.push({
    id: 'first-bill-total',
    label: multi ? `ค่างวดเดือนแรก (รวม ${totalPieces} ชิ้น)` : 'ค่างวดเดือนแรก (บิลที่ 1)',
    amount: totalFirstBill,
  })

  return {
    items: breakdowns,
    aggregateLines,
    total: totalAdvance + totalFirstBill,
  }
}
