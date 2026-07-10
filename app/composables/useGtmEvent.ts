import type { InquiryItem } from '~~/shared/types/inquiry'
import type { GtmEcommerceItem } from '~~/shared/utils/gtmEvents'
import {
  GTM_EVENTS,
  gtmEcommercePayload,
  inquiryItemToGtmItem,
} from '~~/shared/utils/gtmEvents'

function isAdminPath(path: string) {
  return path === '/admin' || path.startsWith('/admin/')
}

export function useGtmEvent() {
  const config = useRuntimeConfig()
  const route = useRoute()

  function canTrack() {
    if (!import.meta.client) return false
    if (!String(config.public.gtmId ?? '').trim()) return false
    if (isAdminPath(route.path)) return false
    return true
  }

  function push(payload: Record<string, unknown>) {
    if (!canTrack()) return
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push(payload)
  }

  function pushEcommerceEvent(event: string, items: GtmEcommerceItem[]) {
    push({ ecommerce: null })
    push({
      event,
      ecommerce: gtmEcommercePayload(items),
    })
  }

  function trackViewItem(item: GtmEcommerceItem) {
    pushEcommerceEvent(GTM_EVENTS.VIEW_ITEM, [item])
  }

  function trackAddToCart(item: InquiryItem) {
    pushEcommerceEvent(GTM_EVENTS.ADD_TO_CART, [inquiryItemToGtmItem(item)])
  }

  function trackBeginInquiry(items: InquiryItem[]) {
    if (!items.length) return
    pushEcommerceEvent(GTM_EVENTS.BEGIN_INQUIRY, items.map(inquiryItemToGtmItem))
  }

  function trackGenerateLead(payload: {
    inquiryId: string
    itemCount: number
    items: InquiryItem[]
  }) {
    const mapped = payload.items.map(inquiryItemToGtmItem)
    push({ ecommerce: null })
    push({
      event: GTM_EVENTS.GENERATE_LEAD,
      lead_type: 'subscribe_inquiry',
      inquiry_id: payload.inquiryId,
      item_count: payload.itemCount,
      ecommerce: gtmEcommercePayload(mapped),
    })
  }

  function trackLineClick(payload: { href: string, label?: string }) {
    push({
      event: GTM_EVENTS.LINE_CLICK,
      link_url: payload.href,
      link_text: payload.label?.slice(0, 100) || undefined,
    })
  }

  function trackPhoneClick(payload: { href: string, label?: string }) {
    push({
      event: GTM_EVENTS.PHONE_CLICK,
      link_url: payload.href,
      link_text: payload.label?.slice(0, 100) || undefined,
    })
  }

  return {
    trackViewItem,
    trackAddToCart,
    trackBeginInquiry,
    trackGenerateLead,
    trackLineClick,
    trackPhoneClick,
  }
}
