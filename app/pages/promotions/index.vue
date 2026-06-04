<script setup lang="ts">
import type { Promotion } from '~~/shared/types/promotion'
import { promotionBannerSrc } from '~~/shared/utils/promotionDisplay'

definePageMeta({
  layout: 'default',
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: 'โปรโมชั่น' },
  ],
})

useSeoMeta({ title: 'โปรโมชั่น — LG Subscribe' })

type PromotionRow = Promotion & { product_count: number }

const { data: promotions, pending, error } = await useFetch<PromotionRow[]>('/api/public/promotions', {
  default: () => [],
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <main class="index-container py-8 sm:py-12">
      <h1 class="mb-8 text-2xl font-bold text-gray-900 sm:text-3xl">โปรโมชั่น</h1>

      <div v-if="pending" class="py-20 text-center text-gray-400">กำลังโหลด...</div>
      <div v-else-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">โหลดไม่สำเร็จ</div>
      <div v-else-if="!promotions?.length" class="py-20 text-center text-gray-500">ยังไม่มีโปรโมชั่น</div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="p in promotions"
          :key="p.id"
          :to="`/promotions/${p.slug}`"
          class="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
        >
          <div v-if="p.image_url" class="aspect-[2/1] overflow-hidden bg-gray-50">
            <img :src="promotionBannerSrc(p.image_url, p.updated_at)" :alt="p.title" class="h-full w-full object-cover transition group-hover:scale-[1.02]">
          </div>
          <div v-else class="flex aspect-[2/1] items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
            <Icon name="heroicons:gift" class="h-12 w-12 text-red-300" />
          </div>
          <div class="p-5">
            <h2 class="text-lg font-semibold text-gray-900 group-hover:text-red-600">{{ p.title }}</h2>
            <p v-if="p.headline" class="mt-1 text-sm text-red-600">{{ p.headline }}</p>
            <p v-if="p.description" class="mt-2 line-clamp-2 text-sm text-gray-600">{{ p.description }}</p>
            <p class="mt-3 text-xs text-gray-400">{{ p.product_count }} สินค้าในโปร</p>
          </div>
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
