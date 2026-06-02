<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import { groupProducts } from '~~/shared/utils/productGroupDisplay'

definePageMeta({
  layout: 'default',
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: 'สินค้าทั้งหมด' },
  ],
})

useSeoMeta({
  title: 'สินค้าทั้งหมด — LG Subscribe',
})

const { data: products, pending, error } = await useFetch<Product[]>('/api/public/products', {
  default: () => [],
})

const displayGroups = computed(() => groupProducts(products.value ?? []))

const compareList = ref<Product[]>([])

function onCompare(product: Product, checked: boolean) {
  if (checked) {
    if (!compareList.value.find(p => p.id === product.id)) {
      compareList.value.push(product)
    }
  }
  else {
    compareList.value = compareList.value.filter(p => p.id !== product.id)
  }
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 class="mb-8 text-2xl font-bold text-gray-900 sm:text-3xl">
        สินค้าทั้งหมด
      </h1>

      <div v-if="pending" class="py-20 text-center text-gray-400">
        กำลังโหลดสินค้า...
      </div>

      <div v-else-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        โหลดสินค้าไม่สำเร็จ
      </div>

      <div
        v-else-if="!displayGroups.length"
        class="py-20 text-center text-gray-500"
      >
        ยังไม่มีสินค้าที่เผยแพร่
      </div>

      <template v-else>
        <p class="mb-4 text-sm text-gray-500">
          {{ displayGroups.length }} กลุ่ม · {{ products?.length ?? 0 }} SKU
        </p>

        <!-- Grid แบบ lg.com -->
        <div
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <ProductGroupCard
            v-for="g in displayGroups"
            :key="g.groupId ?? g.variants[0]!.id"
            :group="g"
            @compare="onCompare"
          />
        </div>
      </template>

      <p
        v-if="compareList.length"
        class="fixed bottom-4 right-4 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg"
      >
        เปรียบเทียบ {{ compareList.length }} รายการ
      </p>
    </main>
  </div>
</template>
