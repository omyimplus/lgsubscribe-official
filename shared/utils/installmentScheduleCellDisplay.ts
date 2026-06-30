import type { InstallmentScheduleCell, InstallmentScheduleColumn } from '~~/shared/utils/installmentSchedule'
import { formatMoneyAmount } from '~~/shared/utils/moneyFormat'

function formatPrice(n: number) {
  return formatMoneyAmount(n, '0')
}

function formatNormalBaht(base: number) {
  return `ปกติ ${formatPrice(base)} บาท`
}

export function cartComboActive(comboPercent: number, variant: 'cart' | 'product') {
  return variant === 'cart' && comboPercent > 0
}

export function showBill1FullPriceNote(
  cell: Pick<InstallmentScheduleCell, 'source_bill' | 'in_contract' | 'is_advance' | 'prepaid_at_signup'>,
  colHasAdvance: boolean,
  comboPercent: number,
  variant: 'cart' | 'product',
) {
  return cartComboActive(comboPercent, variant)
    && cell.in_contract
    && !cell.is_advance
    && !cell.prepaid_at_signup
    && cell.source_bill === 1
    && !colHasAdvance
}

export function showSimpleComboDiscount(
  cell: Pick<InstallmentScheduleCell, 'source_bill' | 'combo_applied' | 'is_advance' | 'percent' | 'in_contract' | 'prepaid_at_signup'>,
  colHasAdvance: boolean,
  comboPercent: number,
  variant: 'cart' | 'product',
) {
  return cell.combo_applied
    && cell.percent > 0
    && !cell.is_advance
    && !showBill1FullPriceNote(cell, colHasAdvance, comboPercent, variant)
}

export function comboSavingsAmount(
  cell: Pick<
    InstallmentScheduleCell,
    | 'source_bill'
    | 'in_contract'
    | 'base'
    | 'charged'
    | 'combo_applied'
    | 'is_advance'
    | 'is_signup_payment'
    | 'prepaid_at_signup'
    | 'percent'
    | 'deferred_discount'
    | 'own_discount'
  >,
  colHasAdvance: boolean,
  comboPercent: number,
  variant: 'cart' | 'product',
) {
  if (cell.is_advance || cell.is_signup_payment || cell.prepaid_at_signup) return 0
  if (showBill1FullPriceNote(cell, colHasAdvance, comboPercent, variant)) return 0
  if (!cell.combo_applied || cell.percent <= 0) return 0
  return Math.max(0, cell.base - cell.charged)
}

export function showDeferBill1ComboNote(
  cell: Pick<
    InstallmentScheduleCell,
    | 'source_bill'
    | 'combo_applied'
    | 'is_advance'
    | 'is_signup_payment'
    | 'prepaid_at_signup'
    | 'deferred_discount'
    | 'percent'
  >,
  colHasAdvance: boolean,
) {
  return !colHasAdvance
    && !cell.is_advance
    && !cell.is_signup_payment
    && !cell.prepaid_at_signup
    && cell.source_bill === 2
    && cell.combo_applied
    && cell.percent > 0
    && cell.deferred_discount > 0
}

export type ScheduleCellHtmlLine = {
  text: string
  className?: string
}

export function buildScheduleCellHtmlLines(
  cell: InstallmentScheduleCell,
  col: InstallmentScheduleColumn,
  comboPercent: number,
  variant: 'cart' | 'product',
): ScheduleCellHtmlLine[] {
  if (!cell.in_contract) {
    return [{ text: '—', className: 'muted' }]
  }

  if (cell.is_advance) {
    return [
      { text: 'มัดจำ', className: 'sub' },
      { text: formatPrice(cell.charged), className: 'price' },
      { text: 'ชำระวันทำรายการ', className: 'accent-sub' },
    ]
  }

  if (cell.is_signup_payment) {
    return [
      { text: 'งวดที่ 1', className: 'sub' },
      { text: formatPrice(cell.charged), className: 'price' },
      { text: 'ชำระวันทำรายการ', className: 'accent-sub' },
    ]
  }

  if (cell.prepaid_at_signup) {
    return [{ text: '—', className: 'muted' }]
  }

  const lines: ScheduleCellHtmlLine[] = []
  const colHasAdvance = col.has_advance

  if (showBill1FullPriceNote(cell, colHasAdvance, comboPercent, variant)) {
    lines.push({ text: formatNormalBaht(cell.base), className: 'sub' })
    lines.push({ text: 'ยังไม่หัก combo', className: 'muted' })
    return lines
  }

  if (showDeferBill1ComboNote(cell, colHasAdvance)) {
    lines.push({ text: formatNormalBaht(cell.base), className: 'sub' })
    lines.push({ text: 'รวม combo งวดแรก', className: 'accent-sub' })
    const savings = comboSavingsAmount(cell, colHasAdvance, comboPercent, variant)
    lines.push({ text: `ส่วนลด combo −${formatPrice(savings)} บาท`, className: 'accent-sub' })
    lines.push({ text: formatPrice(cell.charged), className: 'price' })
    return lines
  }

  if (showSimpleComboDiscount(cell, colHasAdvance, comboPercent, variant) || cell.base > 0) {
    lines.push({ text: formatNormalBaht(cell.base), className: 'sub' })
    const savings = comboSavingsAmount(cell, colHasAdvance, comboPercent, variant)
    if (savings > 0) {
      lines.push({ text: `ส่วนลด combo −${formatPrice(savings)} บาท`, className: 'accent-sub' })
    }
  }

  if (!showDeferBill1ComboNote(cell, colHasAdvance)) {
    lines.push({ text: formatPrice(cell.charged), className: 'price' })
  }

  return lines
}
