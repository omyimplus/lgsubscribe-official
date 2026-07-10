import type { InquiryItem } from '~~/shared/types/inquiry'
import type { Product } from '~~/shared/types/product'

export const GTM_EVENTS = {
  VIEW_ITEM: 'view_item',
  ADD_TO_CART: 'add_to_cart',
  BEGIN_INQUIRY: 'begin_inquiry',
  GENERATE_LEAD: 'generate_lead',
  LINE_CLICK: 'line_click',
  PHONE_CLICK: 'phone_click',
} as const

export type GtmEcommerceItem = {
  item_id: string
  item_name: string
  item_variant?: string
  price?: number
  quantity?: number
}

export function isLineOaHref(href: string): boolean {
  try {
    const host = new URL(href, 'https://lgsubscribe-official.com').hostname.toLowerCase()
    return host === 'lin.ee' || host.endsWith('.lin.ee') || host === 'line.me' || host.endsWith('.line.me')
  }
  catch {
    return false
  }
}

export function isPhoneHref(href: string): boolean {
  return href.trim().toLowerCase().startsWith('tel:')
}

export function productToGtmItem(product: Product): GtmEcommerceItem {
  return {
    item_id: product.id,
    item_name: product.name,
    price: product.plan_pricing?.display_monthly_price
      ?? product.plan_pricing?.from_monthly_price
      ?? undefined,
    quantity: 1,
  }
}

export function inquiryItemToGtmItem(item: InquiryItem): GtmEcommerceItem {
  const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))
  return {
    item_id: item.product_id,
    item_name: item.name,
    item_variant: item.plan_id,
    price: item.monthly_price,
    quantity,
  }
}

export function gtmEcommerceValue(items: GtmEcommerceItem[]): number {
  return items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1), 0)
}

export function gtmEcommercePayload(items: GtmEcommerceItem[]) {
  const value = gtmEcommerceValue(items)
  return {
    currency: 'THB',
    value,
    items,
  }
}
