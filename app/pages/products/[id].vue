<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import {
  productHasPlanPricing,
} from '~/composables/useProductPlanPricing'
import { hasRichHtmlContent } from '~~/shared/utils/richHtmlContent'
import {
  buildProductJsonLd,
} from '~~/shared/utils/siteSeoJsonLd'
import { productKeywords } from '~~/shared/utils/siteSeoPresets'
import {
  primaryProductImageUrl,
  productGalleryUrls,
} from '~~/shared/utils/productHeroImage'
import { productToGtmItem } from '~~/shared/utils/gtmEvents'

definePageMeta({ layout: 'default', showHero: false })

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
const pricingAnchorRef = ref<HTMLElement | null>(null)
const pricingMobileAnchorRef = ref<HTMLElement | null>(null)

const galleryUrls = computed(() => productGalleryUrls(product.value))

const hasPricing = computed(() => product.value ? productHasPlanPricing(product.value) : false)

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

const { trackViewItem } = useGtmEvent()
const trackedViewItemId = ref<string | null>(null)

watch(product, (p) => {
  if (!p) return
  selectedImage.value = primaryProductImageUrl(p)
  setBreadcrumb([
    { label: 'สินค้าทั้งหมด', to: '/products' },
    { label: p.name },
  ])
  if (trackedViewItemId.value !== p.id) {
    trackedViewItemId.value = p.id
    trackViewItem(productToGtmItem(p))
  }
}, { immediate: true })

const siteUrl = useSiteUrl()

useSiteSeo({
  title: () => product.value?.name ?? 'สินค้า',
  description: () => product.value?.headline || product.value?.description || product.value?.name || undefined,
  keywords: () => product.value
    ? productKeywords(product.value.name, product.value.category?.name, product.value.sku)
    : undefined,
  image: () => primaryProductImageUrl(product.value),
  imageAlt: () => product.value?.name,
  type: 'product',
  schema: {
    breadcrumbs: computed(() => {
      const p = product.value
      if (!p) return undefined
      return [
        { name: 'หน้าแรก', path: '/' },
        { name: 'สินค้าทั้งหมด', path: '/products' },
        { name: p.name },
      ]
    }),
  },
  jsonLd: () => {
    const p = product.value
    if (!p) return undefined
    const monthly = p.plan_pricing?.from_monthly_price ?? p.plan_pricing?.display_monthly_price
    return buildProductJsonLd({
      siteUrl: siteUrl.value,
      path: `/products/${p.id}`,
      name: p.name,
      description: p.headline || p.description,
      image: primaryProductImageUrl(p),
      sku: p.sku,
      category: p.category?.name,
      price: monthly ?? null,
    })
  },
})

useEmbeddedVideos(tabPanelRef, activeTabHtml)
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-gray-50">
    <main v-if="product" class="index-container min-w-0 py-8 sm:py-12">
      <div class="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <!-- ซ้าย: รูป (มือถือ — รายละเอียดอยู่คอลัมน์ขวาถัดจากรูป ไม่ให้รีวิวคั่นกลาง) -->
        <div class="min-w-0 space-y-5">
          <section class="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <ProductHeroImage
              :product="product"
              :selected-url="selectedImage"
            />
          </section>

          <ProductGalleryThumbnails
            v-if="galleryUrls.length > 1"
            v-model:selected-url="selectedImage"
            :urls="galleryUrls"
            :product-name="product.name"
          />

          <!-- มือถือ: ราคาผ่อนทันทีใต้แกลเลอรี่ -->
          <div ref="pricingMobileAnchorRef" class="lg:hidden">
            <ProductPdpPricingSection
              :product="product"
              @open-plan="openPlanDialog"
              @open-schedule="scheduleOpen = true"
            />
          </div>
        </div>

        <!-- ขวา: ชื่อ · คุณลักษณะที่สำคัญ (รวม รหัสสินค้า) · ราคาผ่อน -->
        <div class="min-w-0 space-y-6">
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
              class="product-detail-html prose prose-sm mt-3 max-w-full min-w-0 overflow-x-auto text-gray-700"
              v-html="product.key_features"
            />
            <p v-else class="mt-3 text-sm text-gray-500">
              ยังไม่มีข้อมูลคุณลักษณะที่สำคัญ
            </p>
          </section>

          <!-- เดสก์ท็อป: ราคาผ่อนในคอลัมน์ขวา (ต้นฉบับ) -->
          <div ref="pricingAnchorRef" class="hidden lg:block">
            <ProductPdpPricingSection
              :product="product"
              @open-plan="openPlanDialog"
              @open-schedule="scheduleOpen = true"
            />
          </div>

          <ProductSubscribeValueSection :product="product" />
        </div>
      </div>

      <ProductCustomerReviewsSection
        v-if="product.category_id"
        class="mt-8 min-w-0"
        :category-id="product.category_id"
      />

      <!-- ล่าง: แท็บที่มีข้อมูลเท่านั้น -->
      <section
        v-if="visibleTabs.length"
        class="mt-10 min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-[#f1eee6] shadow-sm"
      >
        <div
          class="flex gap-2 overflow-x-auto border-b border-gray-200/80 bg-[#f1eee6] px-3 py-1.5 sm:px-4"
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
              : 'bg-transparent text-gray-600 hover:bg-white/60 hover:text-gray-900'"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div
          ref="tabPanelRef"
          role="tabpanel"
          class="product-detail-html prose prose-sm max-w-full min-w-0 overflow-x-auto p-5 text-gray-700 sm:p-8 sm:prose-base"
          v-html="activeTabHtml"
        />
      </section>

      <ClientOnly>
        <ProductPdpPricingFloat
          v-if="hasPricing"
          :product="product"
          :anchor-el="pricingAnchorRef"
          :mobile-anchor-el="pricingMobileAnchorRef"
          @open-plan="openPlanDialog"
          @open-schedule="scheduleOpen = true"
        />
        <ProductInstallmentDialog
          ref="installmentDialogRef"
          :open="planDialogOpen"
          :product="product"
          @update:open="planDialogOpen = $event"
        />
        <ProductInstallmentScheduleDialog
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
