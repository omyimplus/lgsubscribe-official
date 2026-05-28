<script setup lang="ts">
import type { Product } from '~~/shared/types/product'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'สินค้าทั้งหมด — LG Subscribe',
})

const { data: products, pending, error } = await useFetch<Product[]>('/api/public/products', {
  default: () => [],
})

const compareList = ref<Product[]>([])

function onSubscribe(product: Product) {
  // TODO: flow สั่ง Subscribe
  console.log('subscribe', product.id)
}

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
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <NuxtLink to="/" class="text-lg font-bold text-gray-900">LG Subscribe</NuxtLink>
        <nav class="text-sm text-gray-600">
          <NuxtLink to="/" class="hover:text-red-600">หน้าแรก</NuxtLink>
          <span class="mx-2">/</span>
          <span class="text-gray-900">สินค้าทั้งหมด</span>
        </nav>
        <div class="flex items-center gap-3 text-sm">
          <NuxtLink to="/auth/login" class="text-gray-600 hover:text-red-600">เข้าสู่ระบบ</NuxtLink>
          <NuxtLink to="/auth/register" class="rounded-full bg-red-500 px-3 py-1.5 font-medium text-white hover:bg-red-600">
            สมัครสมาชิก
          </NuxtLink>
        </div>
      </div>
    </header>

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
        v-else-if="!products?.length"
        class="py-20 text-center text-gray-500"
      >
        ยังไม่มีสินค้าที่เผยแพร่
      </div>

      <!-- Grid แบบ lg.com -->
      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <ProductCard
          v-for="p in products"
          :key="p.id"
          :product="p"
          @subscribe="onSubscribe"
          @compare="onCompare"
        />
      </div>

      <p
        v-if="compareList.length"
        class="fixed bottom-4 right-4 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg"
      >
        เปรียบเทียบ {{ compareList.length }} รายการ
      </p>
    </main>
  </div>
</template>
