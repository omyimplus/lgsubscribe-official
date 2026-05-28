<script setup lang="ts">
import type { Product } from '~~/shared/types/product'

const route = useRoute()
const id = route.params.id as string

const { data: products } = await useFetch<Product[]>('/api/public/products', {
  default: () => [],
})

const product = computed(() => products.value?.find(p => p.id === id))
const selectedImage = ref('')

watch(product, (p) => {
  if (!p) return
  selectedImage.value = p.image_urls?.[0] || p.image_url || ''
}, { immediate: true })

useSeoMeta({
  title: () => product.value?.name ?? 'สินค้า',
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <header class="border-b border-gray-200">
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <NuxtLink to="/products" class="text-sm text-gray-600 hover:text-red-600">
          ← กลับสินค้าทั้งหมด
        </NuxtLink>
      </div>
    </header>

    <main v-if="product" class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div class="grid gap-8 lg:grid-cols-2">
        <section>
          <div class="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4">
            <img
              :src="selectedImage || product.image_url || ''"
              class="h-[360px] w-full object-contain"
              :alt="product.name"
            >
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(url, idx) in (product.image_urls?.length ? product.image_urls : (product.image_url ? [product.image_url] : []))"
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

        <section class="space-y-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">{{ product.name }}</h1>
            <p class="mt-1 text-sm text-gray-500">SKU: {{ product.sku }}</p>
          </div>

          <ProductCard :product="product" />

          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 class="mb-2 text-lg font-semibold text-gray-900">รายละเอียดสินค้า</h2>
            <div
              class="prose prose-sm max-w-none text-gray-700"
              v-html="product.description || '<p>-</p>'"
            />
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 class="mb-2 text-lg font-semibold text-gray-900">คุณลักษณะที่สำคัญ</h2>
            <div
              class="prose prose-sm max-w-none text-gray-700"
              v-html="product.key_features || '<p>-</p>'"
            />
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 class="mb-2 text-lg font-semibold text-gray-900">คุณสมบัติ</h2>
            <div
              class="prose prose-sm max-w-none text-gray-700"
              v-html="product.features || '<p>-</p>'"
            />
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 class="mb-2 text-lg font-semibold text-gray-900">สเปค</h2>
            <div
              class="prose prose-sm max-w-none text-gray-700"
              v-html="product.specifications || '<p>-</p>'"
            />
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 class="mb-2 text-lg font-semibold text-gray-900">FAQ</h2>
            <div
              class="prose prose-sm max-w-none text-gray-700"
              v-html="product.faq_html || '<p>-</p>'"
            />
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 class="mb-3 text-lg font-semibold text-gray-900">ข้อมูลบริการ</h2>
            <ul class="space-y-2 text-sm text-gray-700">
              <li>ทำความสะอาดด้วยตนเอง: {{ product.service_self_clean ? 'มี' : 'ไม่มี' }}</li>
              <li>ทำความสะอาดโดยช่าง: {{ product.service_technician ? 'มี' : 'ไม่มี' }}</li>
              <li>รอบบริการ: {{ product.service_months ?? '-' }} เดือน</li>
              <li>ผ่อนชำระ: {{ product.installment_months ?? '-' }} เดือน</li>
              <li>รับประกัน: {{ product.warranty_years ?? '-' }} ปี</li>
            </ul>
          </div>
        </section>
      </div>
    </main>

    <main v-else class="mx-auto max-w-7xl px-4 py-20 text-center text-gray-500">
      ไม่พบสินค้า
    </main>
  </div>
</template>
