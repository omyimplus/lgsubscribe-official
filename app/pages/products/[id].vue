<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import { formatBaht } from '~/composables/useProductPricing'
import {
  cardMonthlyPrice,
  cardPricePrefix,
  productHasPlanPricing,
} from '~/composables/useProductPlanPricing'
import { hasRichHtmlContent } from '~~/shared/utils/richHtmlContent'

definePageMeta({ layout: 'default' })

type DetailTab = 'features' | 'specifications' | 'faq'

const DETAIL_TABS: { key: DetailTab, label: string }[] = [
  { key: 'features', label: 'คุณสมบัติ' },
  { key: 'specifications', label: 'สเปค' },
  { key: 'faq', label: 'FAQ' },
]

function tabHtml(p: Product, key: DetailTab) {
  if (key === 'features') return p.features
  if (key === 'specifications') return p.specifications
  return p.faq_html
}

const route = useRoute()
const id = route.params.id as string
const { set: setBreadcrumb } = usePageBreadcrumb()
const cart = useInterestCart()

const { data: products } = await useFetch<Product[]>('/api/public/products', {
  key: 'public-products-list',
  default: () => [],
})

const product = computed(() => products.value?.find(p => p.id === id))
const selectedImage = ref('')
const planDialogOpen = ref(false)
const scheduleOpen = ref(false)
const installmentDialogRef = ref<{ present: () => Promise<void> } | null>(null)
const copiedSku = ref(false)
const activeTab = ref<DetailTab>('features')
const tabPanelRef = ref<HTMLElement | null>(null)

const galleryUrls = computed(() => {
  const p = product.value
  if (!p) return []
  if (p.image_urls?.length) return p.image_urls
  return p.image_url ? [p.image_url] : []
})

const hasPricing = computed(() => product.value ? productHasPlanPricing(product.value) : false)
const pricing = computed(() => product.value?.plan_pricing)
const monthlyPrice = computed(() => cardMonthlyPrice(pricing.value))
const pricePrefix = computed(() => cardPricePrefix(pricing.value))
const inCart = computed(() => product.value ? cart.hasProduct(product.value.id) : false)

const visibleTabs = computed(() => {
  const p = product.value
  if (!p) return []
  return DETAIL_TABS.filter(tab => hasRichHtmlContent(tabHtml(p, tab.key)))
})

const activeTabHtml = computed(() => {
  const p = product.value
  if (!p || !activeTab.value) return ''
  return tabHtml(p, activeTab.value) ?? ''
})

watch(visibleTabs, (tabs) => {
  if (!tabs.length) {
    activeTab.value = 'features'
    return
  }
  if (!tabs.some(t => t.key === activeTab.value)) {
    activeTab.value = tabs[0]!.key
  }
}, { immediate: true })

async function openPlanDialog() {
  planDialogOpen.value = true
  await nextTick()
  await installmentDialogRef.value?.present()
}

async function copySku() {
  const sku = product.value?.sku
  if (!sku) return
  try {
    await navigator.clipboard.writeText(sku)
    copiedSku.value = true
    setTimeout(() => { copiedSku.value = false }, 1500)
  }
  catch { /* ignore */ }
}

watch(product, (p) => {
  if (!p) return
  selectedImage.value = p.image_urls?.[0] || p.image_url || ''
  setBreadcrumb([
    { label: 'สินค้าทั้งหมด', to: '/products' },
    { label: p.name },
  ])
}, { immediate: true })

useSeoMeta({
  title: () => product.value?.name ?? 'สินค้า',
})

useEmbeddedVideos(tabPanelRef, activeTabHtml)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <main v-if="product" class="index-container py-8 sm:py-12">
      <div class="grid gap-8 lg:grid-cols-2 lg:items-start">
        <!-- ซ้าย: รูป -->
        <div class="space-y-5">
          <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <img
              :src="selectedImage || product.image_url || ''"
              class="mx-auto h-auto max-h-[28rem] w-full object-contain"
              :alt="product.name"
            >
          </section>

          <div v-if="galleryUrls.length > 1" class="flex flex-wrap gap-2">
            <button
              v-for="(url, idx) in galleryUrls"
              :key="`${url}-${idx}`"
              type="button"
              class="overflow-hidden rounded-lg border-2 bg-white p-1 transition"
              :class="selectedImage === url ? 'border-[#ea1917]' : 'border-gray-200 hover:border-gray-300'"
              @click="selectedImage = url"
            >
              <img
                :src="url"
                class="h-16 w-16 object-contain"
                :alt="`${product.name}-${idx + 1}`"
              >
            </button>
          </div>
        </div>

        <!-- ขวา: ชื่อ · คุณลักษณะที่สำคัญ (รวม รหัสสินค้า) · ราคาผ่อน -->
        <div class="space-y-6">
          <div class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <h1 class="text-lg font-semibold leading-snug text-[#ea1917] sm:text-xl">
              {{ product.name }}
            </h1>
          </div>

          <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-gray-100 pb-4 text-sm text-gray-600">
              <span>รหัสสินค้า:</span>
              <span class="font-mono text-gray-900">{{ product.sku }}</span>
              <button
                type="button"
                class="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#ea1917]"
                @click="copySku"
              >
                <Icon
                  :name="copiedSku ? 'heroicons:check' : 'heroicons:clipboard-document'"
                  class="h-3.5 w-3.5"
                />
                {{ copiedSku ? 'คัดลอกแล้ว' : 'คัดลอก' }}
              </button>
            </div>
            <h2 class="mt-4 text-base font-semibold text-gray-900">
              คุณลักษณะที่สำคัญ
            </h2>
            <div
              v-if="hasRichHtmlContent(product.key_features)"
              class="product-detail-html prose prose-sm mt-3 max-w-none text-gray-700"
              v-html="product.key_features"
            />
            <p v-else class="mt-3 text-sm text-gray-500">
              ยังไม่มีข้อมูลคุณลักษณะที่สำคัญ
            </p>
          </section>

          <ProductSubscribeValueSection :product="product" />

          <section
            v-if="hasPricing"
            class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900">
              ราคาผ่อน
            </h2>
            <div class="mt-4">
              <p class="flex flex-wrap items-baseline gap-2">
                <span v-if="pricePrefix" class="text-lg font-medium text-gray-600">{{ pricePrefix }}</span>
                <span class="text-3xl font-bold text-[#ea1917]">{{ formatBaht(monthlyPrice!) }}</span>
                <span class="text-sm text-gray-600">/ เดือน</span>
              </p>
              <p v-if="pricing?.display_price_note" class="mt-2 text-sm text-gray-600">
                {{ pricing.display_price_note }}
              </p>
              <span
                v-if="inCart"
                class="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800"
              >
                <Icon name="heroicons:check" class="h-3.5 w-3.5" />
                อยู่ในรายการสนใจผ่อน
              </span>
            </div>

            <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ea1917] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d41715] sm:flex-none"
                @click="openPlanDialog"
              >
                <Icon name="heroicons:shopping-cart" class="h-5 w-5" />
                เลือกแผน / สนใจผ่อน
              </button>
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#1e3354]/25 bg-[#1e3354]/5 py-3 text-sm font-semibold text-[#1e3354] transition hover:bg-[#1e3354]/10 sm:flex-none sm:px-6"
                @click="scheduleOpen = true"
              >
                <Icon name="heroicons:table-cells" class="h-5 w-5" />
                ดูตารางผ่อน
              </button>
            </div>
          </section>
        </div>
      </div>

      <!-- ล่าง: แท็บที่มีข้อมูลเท่านั้น -->
      <section
        v-if="visibleTabs.length"
        class="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        <div
          class="flex gap-2 overflow-x-auto border-b border-gray-200 bg-gray-50/80 px-3 py-1.5 sm:px-4"
          role="tablist"
          aria-label="รายละเอียดสินค้า"
        >
          <button
            v-for="tab in visibleTabs"
            :key="tab.key"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.key"
            class="shrink-0 rounded-lg px-5 py-2 text-base font-semibold transition sm:px-7 sm:py-2.5 sm:text-lg"
            :class="activeTab === tab.key
              ? 'bg-[#ea1917] text-white shadow-sm'
              : 'bg-transparent text-gray-600 hover:bg-white/80 hover:text-gray-900'"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div
          ref="tabPanelRef"
          role="tabpanel"
          class="product-detail-html prose prose-sm max-w-none p-5 text-gray-700 sm:p-8 sm:prose-base"
          v-html="activeTabHtml"
        />
      </section>

      <ClientOnly>
        <ProductInstallmentDialog
          v-if="hasPricing"
          ref="installmentDialogRef"
          :open="planDialogOpen"
          :product="product"
          @update:open="planDialogOpen = $event"
        />
        <ProductInstallmentScheduleDialog
          v-if="hasPricing"
          :open="scheduleOpen"
          :product="product"
          @update:open="scheduleOpen = $event"
        />
      </ClientOnly>
    </main>

    <main v-else class="index-container py-20 text-center text-gray-500">
      ไม่พบสินค้า
      <div class="mt-4">
        <NuxtLink to="/products" class="text-sm font-medium text-[#ea1917] hover:underline">
          กลับรายการสินค้า
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
