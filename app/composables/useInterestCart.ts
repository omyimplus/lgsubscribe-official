import type { Product } from '~~/shared/types/product'
import type { InquiryItem } from '~~/shared/types/inquiry'
import type { ProductPlan, ProductPlanCardOption } from '~~/shared/types/productPlan'
import { planToInquiryItem } from '~~/shared/utils/cartItemFromPlan'
import {
  CART_ITEM_QUANTITY_MAX,
  CART_ITEM_QUANTITY_MIN,
  cartLineKey,
  cartTotalQuantity,
  getCartItemQuantity,
  normalizeCartItem,
  normalizeCartItems,
} from '~~/shared/utils/cartQuantity'
import { buildDueTodaySummary } from '~~/shared/utils/orderDueToday'

const STORAGE_KEY = 'lg-interest-cart'

export type InterestCartItem = InquiryItem

function loadFromStorage(): InterestCartItem[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as InterestCartItem[]
    return Array.isArray(parsed)
      ? normalizeCartItems(parsed.filter(i => i.product_id && i.plan_id))
      : []
  }
  catch {
    return []
  }
}

function saveToStorage(items: InterestCartItem[]) {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useInterestCart() {
  const { trackAddToCart } = useGtmEvent()
  const items = useState<InterestCartItem[]>('interest-cart', () => [])
  const isOpen = useState('interest-cart-open', () => false)

  onMounted(() => {
    items.value = loadFromStorage()
  })

  watch(items, (list) => {
    saveToStorage(list)
  }, { deep: true })

  const count = computed(() => cartTotalQuantity(items.value))
  const lineCount = computed(() => items.value.length)

  const totalMonthly = computed(() =>
    items.value.reduce(
      (sum, i) => sum + i.monthly_price * getCartItemQuantity(i),
      0,
    ),
  )

  const totalContract = computed(() =>
    items.value.reduce(
      (sum, i) => sum + (i.computed_total ?? 0) * getCartItemQuantity(i),
      0,
    ),
  )

  const totalAdvance = computed(() =>
    items.value.reduce(
      (sum, i) => sum + (Number(i.advance_amount) || 0) * getCartItemQuantity(i),
      0,
    ),
  )

  const totalNet = computed(() =>
    items.value.reduce(
      (sum, i) =>
        sum
        + (i.computed_net_total ?? (i.computed_total ?? 0) + (Number(i.advance_amount) || 0))
          * getCartItemQuantity(i),
      0,
    ),
  )

  const dueToday = computed(() => buildDueTodaySummary(items.value))

  const totalDueToday = computed(() => dueToday.value.total)

  function findLineIndex(productId: string, planId: string) {
    const key = `${productId}:${planId}`
    return items.value.findIndex(i => cartLineKey(i) === key)
  }

  function getLine(productId: string, planId: string) {
    const index = findLineIndex(productId, planId)
    return index >= 0 ? items.value[index] : undefined
  }

  function getItem(productId: string) {
    return items.value.find(i => i.product_id === productId)
  }

  function getQuantity(productId: string, planId?: string) {
    if (planId) {
      const line = getLine(productId, planId)
      return line ? getCartItemQuantity(line) : 0
    }
    return items.value
      .filter(i => i.product_id === productId)
      .reduce((sum, i) => sum + getCartItemQuantity(i), 0)
  }

  function hasProduct(productId: string) {
    return items.value.some(i => i.product_id === productId)
  }

  function hasProductPlan(productId: string, planId: string) {
    return findLineIndex(productId, planId) >= 0
  }

  function addItem(item: InterestCartItem) {
    const next = normalizeCartItem(item)
    const index = findLineIndex(next.product_id, next.plan_id)
    if (index >= 0) {
      const current = items.value[index]!
      const mergedQty = Math.min(
        CART_ITEM_QUANTITY_MAX,
        getCartItemQuantity(current) + getCartItemQuantity(next),
      )
      const merged = { ...current, ...next, quantity: mergedQty }
      items.value = items.value.map((line, i) =>
        i === index ? merged : line,
      )
      trackAddToCart(merged)
      return true
    }

    items.value = [...items.value, next]
    trackAddToCart(next)
    return true
  }

  function addProductPlan(product: Product, plan: ProductPlan | ProductPlanCardOption) {
    return addItem(planToInquiryItem(product, plan))
  }

  function addProduct(product: Product, plan?: ProductPlan | ProductPlanCardOption) {
    if (plan) return addProductPlan(product, plan)
    const fallback = product.plans?.find(p => p.is_default) ?? product.plans?.[0]
    if (fallback) return addProductPlan(product, fallback)
    return false
  }

  function setProductPlanQuantity(
    product: Product,
    plan: ProductPlan | ProductPlanCardOption,
    quantity: number,
  ) {
    const qty = Math.min(
      CART_ITEM_QUANTITY_MAX,
      Math.max(CART_ITEM_QUANTITY_MIN, Math.floor(quantity)),
    )
    if (findLineIndex(product.id, plan.id) >= 0) {
      return setQuantity(product.id, plan.id, qty)
    }
    return addItem({ ...planToInquiryItem(product, plan), quantity: qty })
  }

  function setQuantity(productId: string, planId: string, quantity: number) {
    const index = findLineIndex(productId, planId)
    if (index < 0) return false

    const qty = Math.min(CART_ITEM_QUANTITY_MAX, Math.floor(quantity))
    if (qty < CART_ITEM_QUANTITY_MIN) {
      items.value = items.value.filter((_, i) => i !== index)
      return true
    }

    items.value = items.value.map((line, i) =>
      i === index ? { ...line, quantity: qty } : line,
    )
    return true
  }

  function incrementQuantity(productId: string, planId: string, step = 1) {
    const line = getLine(productId, planId)
    if (!line) return false
    return setQuantity(productId, planId, getCartItemQuantity(line) + step)
  }

  function decrementQuantity(productId: string, planId: string, step = 1) {
    const line = getLine(productId, planId)
    if (!line) return false
    return setQuantity(productId, planId, getCartItemQuantity(line) - step)
  }

  function removeLine(productId: string, planId: string) {
    items.value = items.value.filter(i => cartLineKey(i) !== `${productId}:${planId}`)
  }

  function removeProduct(productId: string) {
    items.value = items.value.filter(i => i.product_id !== productId)
  }

  function toggleProduct(product: Product, plan?: ProductPlan | ProductPlanCardOption) {
    const resolved = plan ?? product.plans?.find(p => p.is_default) ?? product.plans?.[0]
    if (!resolved) return false
    return addProductPlan(product, resolved)
  }

  function clear() {
    items.value = []
  }

  function openPanel() {
    isOpen.value = true
  }

  function closePanel() {
    isOpen.value = false
  }

  function togglePanel() {
    isOpen.value = !isOpen.value
  }

  return {
    items,
    count,
    lineCount,
    totalMonthly,
    totalContract,
    totalAdvance,
    totalNet,
    dueToday,
    totalDueToday,
    isOpen,
    getLine,
    getItem,
    getQuantity,
    hasProduct,
    hasProductPlan,
    addItem,
    addProductPlan,
    addProduct,
    setProductPlanQuantity,
    setQuantity,
    incrementQuantity,
    decrementQuantity,
    removeLine,
    removeProduct,
    toggleProduct,
    clear,
    openPanel,
    closePanel,
    togglePanel,
  }
}
