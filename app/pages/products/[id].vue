<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import {
  cardMonthlyPrice,
  cardPricePrefix,
  productHasPlanPricing,
} from '~/composables/useProductPlanPricing'

definePageMeta({ layout: 'default' })

const route = useRoute()
const id = route.params.id as string
const { set: setBreadcrumb } = usePageBreadcrumb()
const cart = useInterestCart()

const { data: products } = await useFetch<Product[]>('/api/public/products', {
  default: () => [],
})

const product = computed(() => products.value?.find(p => p.id === id))
const selectedImage = ref('')
const planDialogOpen = ref(false)
const scheduleOpen = ref(false)
const installmentDialogRef = ref<{ present: () => Promise<void> } | null>(null)

async function openPlanDialog() {
  planDialogOpen.value = true
  await nextTick()
  await installmentDialogRef.value?.present()
}

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

useEmbeddedVideosAfterMount()

watch(product, () => {
  nextTick(() => fixEmbeddedVideos(document))
})

</script>

<template>
  <div class="min-h-screen bg-white">
    <main v-if="product" class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div class="flex flex-col gap-8">
        <header class="space-y-1">
          <h1 class="text-3xl font-bold text-gray-900">{{ product.name }}</h1>
          <p class="text-sm text-gray-500">SKU: {{ product.sku }}</p>
        </header>

        <section class="space-y-4">
          <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4">
            <img
              :src="selectedImage || product.image_url || ''"
              class="mx-auto h-auto max-h-[420px] w-full object-contain"
              :alt="product.name"
            >
          </div>
          <div v-if="galleryUrls.length > 1" class="flex flex-wrap gap-2">
            <button
              v-for="(url, idx) in galleryUrls"
              :key="`${url}-${idx}`"
              type="button"
              class="overflow-hidden rounded-lg border p-1"
              :class="selectedImage === url ? 'border-red-500' : 'border-gray-200'"
              @click="selectedImage = url"
            >
              <img :src="url" class="h-16 w-16 object-contain" :alt="`${product.name}-${idx + 1}`">
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 class="text-lg font-semibold text-gray-900">ราคาผ่อน</h2>
          <div v-if="hasPricing" class="mt-3">
            <p class="flex flex-wrap items-baseline gap-2">
              <span v-if="pricePrefix" class="text-lg font-medium text-gray-600">{{ pricePrefix }}</span>
              <span class="text-3xl font-bold text-red-600">{{ formatBaht(monthlyPrice!) }}</span>
              <span class="text-sm text-gray-600">/ เดือน</span>
            </p>
            <p v-if="pricing?.display_price_note" class="mt-1 text-sm text-gray-600">
              {{ pricing.display_price_note }}
            </p>
            <span
              v-if="inCart"
              class="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
            >
              <Icon name="heroicons:check" class="h-3.5 w-3.5" />
              อยู่ในรายการสนใจผ่อน
            </span>
            <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                class="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#ea1917] py-3 text-sm font-semibold text-[#ea1917] hover:bg-red-50 sm:w-auto sm:px-8"
                @click="openPlanDialog"
              >
                <Icon name="heroicons:document-text" class="h-5 w-5" />
                รายละเอียดผ่อน
              </button>
              <button
                type="button"
                class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#1e3354]/25 bg-[#1e3354]/5 py-3 text-sm font-semibold text-[#1e3354] hover:bg-[#1e3354]/10 sm:w-auto sm:px-8"
                @click="scheduleOpen = true"
              >
                <Icon name="heroicons:table-cells" class="h-5 w-5" />
                ดูตารางผ่อน
              </button>
            </div>
          </div>
          <p v-else class="mt-2 text-sm text-gray-500">
            ยังไม่มีแผนสัญญา — กรุณาติดต่อเพื่อสอบถามราคา
          </p>
        </section>

        <ClientOnly>
          <ProductInstallmentDialog
            v-if="product && hasPricing"
            ref="installmentDialogRef"
            :open="planDialogOpen"
            :product="product"
            @update:open="planDialogOpen = $event"
          />
          <ProductInstallmentScheduleDialog
            v-if="product && hasPricing"
            :open="scheduleOpen"
            :product="product"
            @update:open="scheduleOpen = $event"
          />
        </ClientOnly>

        <div class="flex flex-wrap gap-3">
          <NuxtLink
            to="/subscribe/inquiry"
            class="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ส่งคำขอสนใจผ่อน
          </NuxtLink>
        </div>

        <section class="product-detail-section rounded-2xl border border-gray-200 bg-white p-5">
          <h2 class="mb-3 text-lg font-semibold text-gray-900">รายละเอียดสินค้า</h2>
          <div
            class="product-detail-html prose prose-sm max-w-none text-gray-700"
            v-html="product.description || '<p>-</p>'"
          />
        </section>

        <section class="product-detail-section rounded-2xl border border-gray-200 bg-white p-5">
          <h2 class="mb-3 text-lg font-semibold text-gray-900">คุณลักษณะที่สำคัญ</h2>
          <div
            class="product-detail-html prose prose-sm max-w-none text-gray-700"
            v-html="product.key_features || '<p>-</p>'"
          />
        </section>

        <section class="product-detail-section rounded-2xl border border-gray-200 bg-white p-5">
          <h2 class="mb-3 text-lg font-semibold text-gray-900">คุณสมบัติ</h2>
          <div
            class="product-detail-html prose prose-sm max-w-none text-gray-700"
            v-html="product.features || '<p>-</p>'"
          />
        </section>

        <section class="product-detail-section rounded-2xl border border-gray-200 bg-white p-5">
          <h2 class="mb-3 text-lg font-semibold text-gray-900">สเปค</h2>
          <div
            class="product-detail-html prose prose-sm max-w-none text-gray-700"
            v-html="product.specifications || '<p>-</p>'"
          />
        </section>

        <section class="product-detail-section rounded-2xl border border-gray-200 bg-white p-5">
          <h2 class="mb-3 text-lg font-semibold text-gray-900">FAQ</h2>
          <div
            class="product-detail-html prose prose-sm max-w-none text-gray-700"
            v-html="product.faq_html || '<p>-</p>'"
          />
        </section>

        <section class="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 class="mb-3 text-lg font-semibold text-gray-900">ข้อมูลบริการ</h2>
          <ul class="space-y-2 text-sm text-gray-700">
            <li>รับประกัน: {{ product.warranty_years ?? '-' }} ปี</li>
          </ul>
        </section>
      </div>
    </main>

    <main v-else class="mx-auto max-w-3xl px-4 py-20 text-center text-gray-500">
      ไม่พบสินค้า
    </main>
  </div>
</template>

<style scoped>
.product-detail-html :deep(img) {
  max-width: 100%;
  height: auto;
}

.product-detail-html :deep(video) {
  display: block;
  width: 100%;
  max-width: 100%;
  min-height: 12rem;
  background: #111;
  border-radius: 0.75rem;
}

.product-detail-html :deep(.c-media__container),
.product-detail-html :deep(figure),
.product-detail-html :deep(table) {
  max-width: 100%;
}

.product-detail-html :deep(.c-media__controls),
.product-detail-html :deep(button.c-media__button) {
  display: none !important;
}
</style>
