<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import { productHasPlanPricing } from '~/composables/useProductPlanPricing'

const props = defineProps<{
  product: Product
  /** section ราคาผ่อนบนเดสก์ท็อป */
  anchorEl: MaybeRef<HTMLElement | null | undefined>
  /** section ราคาผ่อนบนมือถือ (ใต้แกลเลอรี่) */
  mobileAnchorEl?: MaybeRef<HTMLElement | null | undefined>
}>()

const emit = defineEmits<{
  openPlan: []
  openSchedule: []
}>()

const { lineOaUrl } = useLineOa()

const visibleDesktop = ref(false)
const visibleMobile = ref(false)

let desktopObserver: IntersectionObserver | null = null
let mobileObserver: IntersectionObserver | null = null

function isDesktopViewport() {
  return import.meta.client && window.matchMedia('(min-width: 1024px)').matches
}

function scrolledPast(entry: IntersectionObserverEntry, topOffset = 96) {
  return !entry.isIntersecting && entry.boundingClientRect.top < topOffset
}

function updateDesktop(entry: IntersectionObserverEntry) {
  if (!isDesktopViewport()) {
    visibleDesktop.value = false
    return
  }
  visibleDesktop.value = scrolledPast(entry)
}

function updateMobile(entry: IntersectionObserverEntry) {
  if (isDesktopViewport()) {
    visibleMobile.value = false
    return
  }
  visibleMobile.value = scrolledPast(entry, 0)
}

function bindObserver(
  el: HTMLElement | null | undefined,
  mode: 'desktop' | 'mobile',
) {
  const current = mode === 'desktop' ? desktopObserver : mobileObserver
  current?.disconnect()
  if (mode === 'desktop') {
    desktopObserver = null
    visibleDesktop.value = false
  }
  else {
    mobileObserver = null
    visibleMobile.value = false
  }
  if (!el || !import.meta.client) return

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return
      if (mode === 'desktop') updateDesktop(entry)
      else updateMobile(entry)
    },
    {
      root: null,
      threshold: 0,
      rootMargin: mode === 'desktop' ? '-96px 0px 0px 0px' : '0px',
    },
  )
  observer.observe(el)
  if (mode === 'desktop') desktopObserver = observer
  else mobileObserver = observer
}

function onResize() {
  if (isDesktopViewport()) {
    visibleMobile.value = false
  }
  else {
    visibleDesktop.value = false
  }
}

watch(
  () => unref(props.anchorEl),
  el => bindObserver(el, 'desktop'),
  { flush: 'post' },
)

watch(
  () => unref(props.mobileAnchorEl),
  el => bindObserver(el, 'mobile'),
  { flush: 'post' },
)

onMounted(() => {
  bindObserver(unref(props.anchorEl), 'desktop')
  bindObserver(unref(props.mobileAnchorEl), 'mobile')
  window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
  desktopObserver?.disconnect()
  mobileObserver?.disconnect()
  window.removeEventListener('resize', onResize)
})

const hasPricing = computed(() => productHasPlanPricing(props.product))
</script>

<template>
  <Teleport to="body">
    <!-- เดสก์ท็อป: กล่องราคาผ่อนลอยขวาบน -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="visibleDesktop && hasPricing"
        class="product-pdp-pricing-float pointer-events-none fixed z-40 hidden lg:block"
      >
        <div class="pointer-events-auto">
          <ProductPdpPricingSection
            :product="product"
            class="shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
            @open-plan="emit('openPlan')"
            @open-schedule="emit('openSchedule')"
          />
        </div>
      </div>
    </Transition>

    <!-- มือถือ: แถบปุ่มล่าง -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="visibleMobile && hasPricing"
        class="product-pdp-pricing-bar fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:hidden"
      >
        <div class="product-pdp-pricing-bar__inner flex gap-2 px-3 py-2.5">
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-[#ea1917] px-2 py-2.5 text-[11px] font-semibold leading-tight text-white sm:text-xs"
            @click="emit('openPlan')"
          >
            <Icon name="heroicons:shopping-cart" class="h-4 w-4 shrink-0" />
            เลือกแผน
          </button>
          <a
            v-if="lineOaUrl"
            :href="lineOaUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-[#06C755] px-2 py-2.5 text-[11px] font-semibold leading-tight text-white sm:text-xs"
          >
            <Icon name="mdi:chat" class="h-4 w-4 shrink-0" />
            ติดต่อสอบถาม
          </a>
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-[#1e3354]/25 bg-[#1e3354]/5 px-2 py-2.5 text-[11px] font-semibold leading-tight text-[#1e3354] sm:text-xs"
            @click="emit('openSchedule')"
          >
            <Icon name="heroicons:table-cells" class="h-4 w-4 shrink-0" />
            ดูตารางผ่อน
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.product-pdp-pricing-float {
  top: 5.5rem;
  right: max(1rem, calc((100vw - min(100vw, 1320px)) / 2 + 1.5rem));
  width: min(22rem, calc(50vw - 2rem));
  max-width: calc(100vw - 2rem);
}

.product-pdp-pricing-bar__inner {
  padding-bottom: max(0.625rem, env(safe-area-inset-bottom));
}
</style>
