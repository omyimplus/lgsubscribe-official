<script setup lang="ts">
import type { CustomerExperiencePublic } from '~~/shared/types/customerExperience'
import {
  EXPERIENCES_PAGE_PATH,
  HOME_EXPERIENCES_LIMIT,
  HOME_EXPERIENCES_SECTION_TITLE,
} from '~~/shared/utils/customerExperienceDisplay'
import {
  experiencesVisibleCount,
  useIndexHorizontalSlider,
} from '~/composables/useIndexHorizontalSlider'

const { data: experiences, pending } = await useFetch<CustomerExperiencePublic[]>(
  () => `/api/public/customer-experiences?limit=${HOME_EXPERIENCES_LIMIT}`,
  {
    key: 'public-home-customer-experiences',
    default: () => [],
  },
)

const itemCount = computed(() => experiences.value?.length ?? 0)
const hasItems = computed(() => itemCount.value > 0)

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
} = useIndexHorizontalSlider(itemCount, experiencesVisibleCount, {
  autoPlay: true,
  autoPlayIntervalMs: 1000,
})

watch(experiences, async () => {
  await nextTick()
  refreshLayout()
}, { deep: true })

watch(pending, async (loading) => {
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
  <section
    v-if="pending || hasItems"
    class="bg-white py-10 sm:py-12"
  >
    <div class="index-container overflow-visible">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 class="text-xl font-bold text-gray-900 sm:text-2xl">
          {{ HOME_EXPERIENCES_SECTION_TITLE }}
        </h2>
        <NuxtLink
          :to="EXPERIENCES_PAGE_PATH"
          class="text-sm font-medium text-[#ea1917] hover:underline"
        >
          ดูทั้งหมด
        </NuxtLink>
      </div>

      <div v-if="pending" class="flex gap-4 overflow-hidden">
        <div
          v-for="i in visibleSlots"
          :key="i"
          class="aspect-[4/3] shrink-0 animate-pulse rounded-xl bg-gray-200"
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
          aria-label="เลื่อนกิจกรรมไปทางซ้าย"
          @click="scrollBy(-1)"
        >
          <Icon name="heroicons:chevron-left" class="h-5 w-5" />
        </button>

        <button
          v-show="showArrows"
          type="button"
          class="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-30 sm:right-2 sm:h-10 sm:w-10"
          :disabled="!canScrollRight"
          aria-label="เลื่อนกิจกรรมไปทางขวา"
          @click="scrollBy(1)"
        >
          <Icon name="heroicons:chevron-right" class="h-5 w-5" />
        </button>

        <div
          ref="scrollerRef"
          class="flex gap-4 overflow-x-auto scroll-smooth px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            v-for="item in experiences"
            :key="item.id"
            class="shrink-0"
            :style="slideStyle"
          >
            <HomeExperienceCard :item="item" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
