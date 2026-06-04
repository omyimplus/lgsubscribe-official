<script setup lang="ts">
import type { ProductDisplayGroup } from '~~/shared/utils/productGroupDisplay'
import { HOME_FEATURED_TAG_NAME } from '~~/shared/utils/homeFeatured'
import {
  featuredProductsVisibleCount,
  useIndexHorizontalSlider,
} from '~/composables/useIndexHorizontalSlider'

const props = defineProps<{
  groups: ProductDisplayGroup[]
  loading?: boolean
}>()

const itemCount = computed(() => props.groups.length)

const {
  scrollerRef,
  canScrollLeft,
  canScrollRight,
  slideStyle,
  showArrows,
  refreshLayout,
  scrollBy,
  pauseAutoPlay,
  resumeAutoPlay,
} = useIndexHorizontalSlider(itemCount, featuredProductsVisibleCount, {
  autoPlay: true,
  autoPlayIntervalMs: 1000,
})

watch(() => props.groups, async () => {
  await nextTick()
  refreshLayout()
}, { deep: true })

watch(() => props.loading, async (loading) => {
  if (!loading) {
    await nextTick()
    refreshLayout()
  }
})

onActivated(async () => {
  await nextTick()
  refreshLayout()
})
</script>

<template>
  <section class="bg-white py-10 sm:py-12">
    <div class="index-container overflow-visible">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 class="text-xl font-bold text-gray-900 sm:text-2xl">
          สินค้าแนะนำสำหรับเดือนนี้
        </h2>
        <NuxtLink
          to="/products"
          class="text-sm font-medium text-[#ea1917] hover:underline"
        >
          ดูสินค้าทั้งหมด
        </NuxtLink>
      </div>

      <div v-if="loading" class="flex gap-4 overflow-hidden">
        <div
          v-for="i in 4"
          :key="i"
          class="h-80 shrink-0 animate-pulse rounded-2xl bg-gray-100"
          :style="slideStyle"
        />
      </div>

      <p
        v-else-if="!groups.length"
        class="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500"
      >
        ยังไม่มีสินค้าที่ติดแท็ก «{{ HOME_FEATURED_TAG_NAME }}» — ตั้งแท็กที่ Admin → สินค้า
      </p>

      <div
        v-else
        class="relative overflow-visible"
        @mouseenter="pauseAutoPlay"
        @mouseleave="resumeAutoPlay"
        @focusin="pauseAutoPlay"
        @focusout="resumeAutoPlay"
      >
        <button
          v-show="showArrows"
          type="button"
          class="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-30 sm:-left-4"
          :disabled="!canScrollLeft"
          aria-label="เลื่อนสินค้าไปทางซ้าย"
          @click="scrollBy(-1)"
        >
          <Icon name="heroicons:chevron-left" class="h-5 w-5" />
        </button>

        <button
          v-show="showArrows"
          type="button"
          class="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-30 sm:-right-4"
          :disabled="!canScrollRight"
          aria-label="เลื่อนสินค้าไปทางขวา"
          @click="scrollBy(1)"
        >
          <Icon name="heroicons:chevron-right" class="h-5 w-5" />
        </button>

        <div
          ref="scrollerRef"
          class="flex gap-4 overflow-x-auto scroll-smooth px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            v-for="g in groups"
            :key="g.groupId ?? g.variants[0]!.id"
            :style="slideStyle"
          >
            <ProductStorefrontCard :group="g" show-home-featured-badge />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
