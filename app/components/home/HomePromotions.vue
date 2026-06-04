<script setup lang="ts">
import type { Promotion } from '~~/shared/types/promotion'
import {
  promotionsVisibleCount,
  useIndexHorizontalSlider,
} from '~/composables/useIndexHorizontalSlider'

type PromotionRow = Promotion & { product_count: number }

const props = defineProps<{
  promotions: PromotionRow[]
  loading?: boolean
}>()

const itemCount = computed(() => props.promotions.length)

const {
  scrollerRef,
  canScrollLeft,
  canScrollRight,
  slideStyle,
  showArrows,
  visibleSlots,
  refreshLayout,
  scrollBy,
  pauseAutoPlay,
  resumeAutoPlay,
} = useIndexHorizontalSlider(itemCount, promotionsVisibleCount, {
  autoPlay: true,
  autoPlayIntervalMs: 1000,
})

watch(() => props.promotions, async () => {
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
  <section v-if="loading || promotions.length" class="bg-gray-50 py-10 sm:py-12">
    <div class="index-container overflow-visible">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 class="text-xl font-bold text-gray-900 sm:text-2xl">
          โปรโมชั่นเดือนนี้สำหรับคุณ
        </h2>
        <NuxtLink
          to="/promotions"
          class="text-sm font-medium text-[#ea1917] hover:underline"
        >
          ดูทั้งหมด
        </NuxtLink>
      </div>

      <div v-if="loading" class="flex gap-4 overflow-hidden">
        <div
          v-for="i in visibleSlots"
          :key="i"
          class="aspect-[2/1] shrink-0 animate-pulse rounded-2xl bg-gray-200"
          :style="slideStyle"
        />
      </div>

      <div
        v-else
        class="relative overflow-hidden"
        @mouseenter="pauseAutoPlay"
        @mouseleave="resumeAutoPlay"
        @focusin="pauseAutoPlay"
        @focusout="resumeAutoPlay"
      >
        <button
          v-show="showArrows"
          type="button"
          class="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-30 sm:left-2 sm:h-10 sm:w-10"
          :disabled="!canScrollLeft"
          aria-label="เลื่อนโปรโมชั่นไปทางซ้าย"
          @click="scrollBy(-1)"
        >
          <Icon name="heroicons:chevron-left" class="h-5 w-5" />
        </button>

        <button
          v-show="showArrows"
          type="button"
          class="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-30 sm:right-2 sm:h-10 sm:w-10"
          :disabled="!canScrollRight"
          aria-label="เลื่อนโปรโมชั่นไปทางขวา"
          @click="scrollBy(1)"
        >
          <Icon name="heroicons:chevron-right" class="h-5 w-5" />
        </button>

        <div
          ref="scrollerRef"
          class="flex gap-4 overflow-x-auto scroll-smooth px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            v-for="p in promotions"
            :key="p.id"
            :style="slideStyle"
          >
            <HomePromotionCard :promotion="p" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
