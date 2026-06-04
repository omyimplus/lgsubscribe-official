<script setup lang="ts">
import type { Promotion } from '~~/shared/types/promotion'
import { promotionBannerSrc } from '~~/shared/utils/promotionDisplay'

defineProps<{
  promotion: Promotion
}>()
</script>

<template>
  <NuxtLink
    :to="`/promotions/${promotion.slug}`"
    class="group block overflow-hidden rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.07)] transition hover:shadow-md"
  >
    <div
      v-if="promotion.image_url"
      class="relative aspect-[2/1] w-full overflow-hidden bg-gray-100"
    >
      <img
        :src="promotionBannerSrc(promotion.image_url, promotion.updated_at)"
        :alt="promotion.title"
        class="absolute inset-0 size-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
        loading="lazy"
      >
    </div>
    <div
      v-else
      class="flex aspect-[2/1] w-full items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50"
      :aria-label="promotion.title"
    >
      <Icon name="heroicons:gift" class="h-14 w-14 text-red-200" />
    </div>
  </NuxtLink>
</template>
