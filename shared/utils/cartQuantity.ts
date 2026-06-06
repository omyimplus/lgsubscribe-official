import type { InquiryItem } from '~~/shared/types/inquiry'

export const CART_ITEM_QUANTITY_MIN = 1
export const CART_ITEM_QUANTITY_MAX = 99

export function cartLineKey(item: Pick<InquiryItem, 'product_id' | 'plan_id'>) {
  return `${item.product_id}:${item.plan_id}`
}

export function getCartItemQuantity(item: Pick<InquiryItem, 'quantity'>) {
  const raw = Number(item.quantity)
  if (!Number.isFinite(raw) || raw < CART_ITEM_QUANTITY_MIN) return CART_ITEM_QUANTITY_MIN
  return Math.min(CART_ITEM_QUANTITY_MAX, Math.floor(raw))
}

export function normalizeCartItem<T extends InquiryItem>(item: T): T {
  return { ...item, quantity: getCartItemQuantity(item) }
}

export function normalizeCartItems(items: InquiryItem[]) {
  return items.map(normalizeCartItem)
}

export function cartTotalQuantity(items: Pick<InquiryItem, 'quantity'>[]) {
  return items.reduce((sum, item) => sum + getCartItemQuantity(item), 0)
}

function lineUnitMonthly(item: Pick<InquiryItem, 'display_monthly_price' | 'monthly_price'>) {
  return Number(item.display_monthly_price ?? item.monthly_price) || 0
}

function lineUnitAdvance(item: Pick<InquiryItem, 'advance_amount'>) {
  return Number(item.advance_amount) || 0
}

function lineUnitNet(item: Pick<InquiryItem, 'computed_net_total' | 'computed_total' | 'advance_amount'>) {
  if (item.computed_net_total != null) return Number(item.computed_net_total) || 0
  if (item.computed_total == null) return null
  return Number(item.computed_total) + lineUnitAdvance(item)
}

/** ราคา/เดือน (ช่วงแรก) รวมทุกชิ้นในรายการ */
export function lineMonthlyTotal(item: Pick<InquiryItem, 'display_monthly_price' | 'monthly_price' | 'quantity'>) {
  return lineUnitMonthly(item) * getCartItemQuantity(item)
}

/** มัดจำรวมทุกชิ้นในรายการ */
export function lineAdvanceTotal(item: Pick<InquiryItem, 'advance_amount' | 'quantity'>) {
  return lineUnitAdvance(item) * getCartItemQuantity(item)
}

/** รวมค่างวดทุกบิล × จำนวนชิ้น */
export function lineContractTotal(item: Pick<InquiryItem, 'computed_total' | 'quantity'>) {
  if (item.computed_total == null) return null
  return item.computed_total * getCartItemQuantity(item)
}

/** ยอดสุทธิโดยประมาณ × จำนวนชิ้น */
export function lineNetTotal(
  item: Pick<InquiryItem, 'computed_net_total' | 'computed_total' | 'advance_amount' | 'quantity'>,
) {
  const unit = lineUnitNet(item)
  if (unit == null) return null
  return unit * getCartItemQuantity(item)
}

export function lineUnitMonthlyPrice(item: Pick<InquiryItem, 'display_monthly_price' | 'monthly_price'>) {
  return lineUnitMonthly(item)
}

export function lineUnitAdvanceAmount(item: Pick<InquiryItem, 'advance_amount'>) {
  return lineUnitAdvance(item)
}

/** ขยายรายการตามจำนวนชิ้น — ใช้ combo / ตารางผ่อน (แต่ละชิ้น = 1 คอลัมน์) */
export function expandInquiryItemsByQuantity(items: InquiryItem[]): InquiryItem[] {
  if (!items.length) return []

  const totalByKey = new Map<string, number>()
  for (const item of items) {
    const key = cartLineKey(item)
    totalByKey.set(key, (totalByKey.get(key) ?? 0) + getCartItemQuantity(item))
  }

  const result: InquiryItem[] = []
  const instanceByKey = new Map<string, number>()

  for (const item of items) {
    const key = cartLineKey(item)
    const qty = getCartItemQuantity(item)
    const needsInstance = (totalByKey.get(key) ?? 0) > 1

    for (let i = 0; i < qty; i++) {
      const instance = (instanceByKey.get(key) ?? 0) + 1
      instanceByKey.set(key, instance)

      const expanded: InquiryItem & { schedule_instance?: number } = {
        ...item,
        quantity: 1,
      }
      if (needsInstance) expanded.schedule_instance = instance
      result.push(expanded)
    }
  }

  return result
}

export function scheduleColumnKey(item: InquiryItem) {
  const base = item.plan_id || item.product_id
  const instance = (item as InquiryItem & { schedule_instance?: number }).schedule_instance
  return instance != null ? `${base}#${instance}` : base
}
