import type { Product } from '~~/shared/types/product'
import type { InquiryItem } from '~~/shared/types/inquiry'
import type { ProductPlan, ProductPlanCardOption } from '~~/shared/types/productPlan'
import { planToInquiryItem } from '~~/shared/utils/cartItemFromPlan'
import { buildDueTodaySummary } from '~~/shared/utils/orderDueToday'

const STORAGE_KEY = 'lg-interest-cart'

export type InterestCartItem = InquiryItem

function loadFromStorage(): InterestCartItem[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as InterestCartItem[]
    return Array.isArray(parsed) ? parsed.filter(i => i.product_id && i.plan_id) : []
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
  const items = useState<InterestCartItem[]>('interest-cart', () => {
    if (import.meta.server) return []
    return loadFromStorage()
  })
  const isOpen = useState('interest-cart-open', () => false)

  onMounted(() => {
    const stored = loadFromStorage()
    if (stored.length && !items.value.length) {
      items.value = stored
    }
  })

  watch(items, (list) => {
    saveToStorage(list)
  }, { deep: true })

  const count = computed(() => items.value.length)

  const totalMonthly = computed(() =>
    items.value.reduce((sum, i) => sum + i.monthly_price, 0),
  )

  const totalContract = computed(() =>
    items.value.reduce((sum, i) => sum + (i.computed_total ?? 0), 0),
  )

  const totalAdvance = computed(() =>
    items.value.reduce((sum, i) => sum + (Number(i.advance_amount) || 0), 0),
  )

  const totalNet = computed(() =>
    items.value.reduce(
      (sum, i) => sum + (i.computed_net_total ?? (i.computed_total ?? 0) + (Number(i.advance_amount) || 0)),
      0,
    ),
  )

  const dueToday = computed(() => buildDueTodaySummary(items.value))

  const totalDueToday = computed(() => dueToday.value.total)

  function getItem(productId: string) {
    return items.value.find(i => i.product_id === productId)
  }

  function hasProduct(productId: string) {
    return items.value.some(i => i.product_id === productId)
  }

  function hasProductPlan(productId: string, planId: string) {
    const item = getItem(productId)
    return item?.plan_id === planId
  }

  function addItem(item: InterestCartItem) {
    items.value = items.value.filter(i => i.product_id !== item.product_id)
    items.value = [...items.value, item]
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

  function removeProduct(productId: string) {
    items.value = items.value.filter(i => i.product_id !== productId)
  }

  function toggleProduct(product: Product, plan?: ProductPlan | ProductPlanCardOption) {
    const resolved = plan ?? product.plans?.find(p => p.is_default) ?? product.plans?.[0]
    if (!resolved) return false
    if (hasProductPlan(product.id, resolved.id)) {
      removeProduct(product.id)
      return false
    }
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
    totalMonthly,
    totalContract,
    totalAdvance,
    totalNet,
    dueToday,
    totalDueToday,
    isOpen,
    getItem,
    hasProduct,
    hasProductPlan,
    addItem,
    addProductPlan,
    addProduct,
    removeProduct,
    toggleProduct,
    clear,
    openPanel,
    closePanel,
    togglePanel,
  }
}
