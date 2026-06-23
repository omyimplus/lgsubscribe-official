<script setup lang="ts">
import type { PromotionWithProducts } from '~~/shared/types/promotion'
import type { ProductDisplayGroup } from '~~/shared/utils/productGroupDisplay'
import { promotionBannerSrc } from '~~/shared/utils/promotionDisplay'
import { promotionKeywords } from '~~/shared/utils/siteSeoPresets'

definePageMeta({ layout: 'default' })

const route = useRoute()
const slug = route.params.slug as string
const { set: setBreadcrumb } = usePageBreadcrumb()

type PromotionPage = PromotionWithProducts & { groups: ProductDisplayGroup[] }

const { data: promotion, pending, error } = await useFetch<PromotionPage>(
  () => `/api/public/promotions/${slug}`,
  { key: `promotion-public-${slug}` },
)

useSiteSeo({
  title: () => promotion.value?.title ?? 'โปรโมชั่น',
  description: () => promotion.value?.description || promotion.value?.headline || undefined,
  keywords: () => promotion.value ? promotionKeywords(promotion.value.title) : undefined,
  image: () => promotion.value?.image_url
    ? promotionBannerSrc(promotion.value.image_url, promotion.value.updated_at)
    : undefined,
  imageAlt: () => promotion.value?.title,
})

watch(
  () => promotion.value?.title,
  (title) => {
    setBreadcrumb([
      { label: 'หน้าแรก', to: '/' },
      { label: 'โปรโมชั่น', to: '/promotions' },
      { label: title ?? slug },
    ])
  },
  { immediate: true },
)

</script>

<template>
  <div class="min-h-screen bg-white">
    <main class="index-container py-8 sm:py-12">
      <div v-if="pending" class="py-20 text-center text-gray-400">กำลังโหลด...</div>
      <div v-else-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">ไม่พบโปรโมชั่น</div>

      <template v-else-if="promotion">
        <div v-if="promotion.image_url" class="mb-8 overflow-hidden rounded-2xl">
          <img
            :src="promotionBannerSrc(promotion.image_url, promotion.updated_at)"
            :alt="promotion.title"
            class="max-h-72 w-full object-cover"
            width="1200"
            height="288"
            loading="lazy"
            decoding="async"
          >
        </div>

        <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">{{ promotion.title }}</h1>
        <p v-if="promotion.headline" class="mt-2 text-lg text-red-600">{{ promotion.headline }}</p>
        <p v-if="promotion.description" class="mt-3 max-w-3xl text-gray-600">{{ promotion.description }}</p>

        <p class="mb-6 mt-8 text-sm text-gray-500">
          {{ promotion.groups.length }} กลุ่ม · {{ promotion.products?.length ?? 0 }} รหัสสินค้า
        </p>

        <div
          v-if="promotion.groups.length"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <ProductGroupCard
            v-for="g in promotion.groups"
            :key="g.groupId ?? g.variants[0]!.id"
            :group="g"
          />
        </div>
        <p v-else class="py-12 text-center text-gray-500">ยังไม่มีสินค้าในโปรนี้</p>
      </template>
    </main>
  </div>
</template>
