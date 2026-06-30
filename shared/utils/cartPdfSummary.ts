import type { InquiryItem } from '~~/shared/types/inquiry'
import type { ProductSubscribeValueRow } from '~~/shared/utils/productSubscribeValue'
import type { ComboQuoteResult } from '~~/shared/utils/comboPricing'
import { getCartItemQuantity, normalizeCartItems } from '~~/shared/utils/cartQuantity'
import { buildDueTodaySummary } from '~~/shared/utils/orderDueToday'
import {
  normalizeSubscribeValueTabs,
  sumSubscribeValueItems,
} from '~~/shared/utils/productSubscribeValue'

export type CartPdfSummaryRow = {
  label: string
  value: string
  accent?: boolean
}

export type CartPdfSubscribeProduct = {
  name: string
  quantity: number
  rows: ProductSubscribeValueRow[]
  total_value: number
}

export type CartPdfSummary = {
  due_today_rows: CartPdfSummaryRow[]
  due_today_total: string
  discount_rows: CartPdfSummaryRow[]
  subscribe_products: CartPdfSubscribeProduct[]
  subscribe_total: number
  has_discount_section: boolean
  has_subscribe_section: boolean
}

function formatBahtPlain(n: number) {
  return `${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(n)} บาท`
}

function formatValueBaht(n: number) {
  if (!n) return 'รับฟรี —'
  return `รับฟรี ${new Intl.NumberFormat('th-TH').format(n)} บาท`
}

export function buildCartPdfSummary(
  items: InquiryItem[],
  comboQuote: ComboQuoteResult | null,
  subscribeByProductId: Map<string, ProductSubscribeValueRow[]>,
): CartPdfSummary {
  const lines = normalizeCartItems(items)
  const dueToday = buildDueTodaySummary(lines)

  const totalContract = lines.reduce(
    (sum, i) => sum + (i.computed_total ?? 0) * getCartItemQuantity(i),
    0,
  )
  const totalAdvance = lines.reduce(
    (sum, i) => sum + (Number(i.advance_amount) || 0) * getCartItemQuantity(i),
    0,
  )
  const totalNet = lines.reduce(
    (sum, i) =>
      sum
      + (i.computed_net_total ?? (i.computed_total ?? 0) + (Number(i.advance_amount) || 0))
        * getCartItemQuantity(i),
    0,
  )

  const due_today_rows: CartPdfSummaryRow[] = dueToday.aggregateLines.map(line => ({
    label: line.label,
    value: formatBahtPlain(line.amount),
  }))

  const discount_rows: CartPdfSummaryRow[] = []

  if (totalContract > 0) {
    discount_rows.push({
      label: 'รวมค่างวดตลอดสัญญา (ก่อนหักส่วนลด)',
      value: formatBahtPlain(totalContract),
    })
  }

  if (comboQuote && comboQuote.percent > 0) {
    discount_rows.push({
      label: `ส่วนลด Combo ${comboQuote.percent}%`
        + (comboQuote.program_name ? ` · ${comboQuote.program_name}` : ''),
      value: comboQuote.savings > 0 ? `−${formatBahtPlain(comboQuote.savings)}` : '—',
      accent: true,
    })
    discount_rows.push({
      label: 'รวมค่างวดหลังส่วนลด Combo',
      value: formatBahtPlain(comboQuote.order_total_charged),
      accent: true,
    })
  }

  if (totalAdvance > 0) {
    discount_rows.push({
      label: 'มัดจำรวม (ชำระวันทำรายการ)',
      value: formatBahtPlain(totalAdvance),
    })
  }

  const netEstimate = comboQuote?.savings
    ? comboQuote.order_total_charged + totalAdvance
    : totalNet

  if (netEstimate > 0) {
    discount_rows.push({
      label: 'ยอดสุทธิโดยประมาณตลอดสัญญา',
      value: formatBahtPlain(netEstimate),
      accent: true,
    })
  }

  const subscribe_products: CartPdfSubscribeProduct[] = []
  let subscribe_total = 0

  for (const item of lines) {
    const tabs = normalizeSubscribeValueTabs(subscribeByProductId.get(item.product_id) ?? [])
      .filter(row => row.text.trim() || row.price > 0)
    if (!tabs.length) continue

    const qty = getCartItemQuantity(item)
    const unitValue = sumSubscribeValueItems(tabs)
    const total_value = unitValue * qty
    subscribe_total += total_value

    subscribe_products.push({
      name: item.name,
      quantity: qty,
      rows: tabs,
      total_value,
    })
  }

  return {
    due_today_rows,
    due_today_total: formatBahtPlain(dueToday.total),
    discount_rows,
    subscribe_products,
    subscribe_total,
    has_discount_section: discount_rows.length > 0,
    has_subscribe_section: subscribe_products.length > 0,
  }
}

export function formatSubscribeValueForPdf(n: number) {
  return formatValueBaht(n)
}

export function formatSubscribeTotalForPdf(n: number) {
  return `${new Intl.NumberFormat('th-TH').format(n)} บาท`
}
