<script setup lang="ts">
import type { CustomerExperiencePublic } from '~~/shared/types/customerExperience'
import {
  PDP_CUSTOMER_REVIEWS_SUBTITLE,
  PDP_CUSTOMER_REVIEWS_TITLE,
} from '~~/shared/utils/customerExperienceDisplay'
import {
  pdpCustomerReviewsVisibleCount,
  useIndexHorizontalSlider,
} from '~/composables/useIndexHorizontalSlider'

const props = defineProps<{
  categoryId: string
}>()

const PDP_REVIEWS_LIMIT = 12

const { data: experiences, pending } = await useFetch<CustomerExperiencePublic[]>(
  () => `/api/public/customer-experiences?category_id=${props.categoryId}&limit=${PDP_REVIEWS_LIMIT}`,
  {
    key: () => `pdp-customer-reviews-${props.categoryId}`,
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
} = useIndexHorizontalSlider(itemCount, pdpCustomerReviewsVisibleCount, {
  autoPlay: true,
  autoPlayIntervalMs: 4000,
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

const {
  lightboxOpen,
  lightboxItem,
  lightboxImageIndex,
  openLightbox,
} = useCustomerExperienceLightbox({
  onOpen: pauseAutoPlay,
  onClose: resumeAutoPlay,
})
</script>

<template>
  <section
    v-if="pending || hasItems"
    class="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
  >
    <h2 class="text-base font-semibold text-gray-900 sm:text-lg">
      {{ PDP_CUSTOMER_REVIEWS_TITLE }}
    </h2>
    <p class="mt-1.5 text-xs leading-relaxed text-gray-600 sm:text-sm">
      {{ PDP_CUSTOMER_REVIEWS_SUBTITLE }}
    </p>

    <div v-if="pending" class="mt-4 flex gap-3 overflow-hidden">
      <div
        v-for="i in visibleSlots"
        :key="i"
        class="aspect-[4/3] shrink-0 animate-pulse rounded-xl bg-gray-200"
        :style="slideStyle"
      />
    </div>

    <div
      v-else
      class="relative mt-4"
      @mouseenter="pauseAutoPlay"
      @mouseleave="resumeAutoPlay"
      @focusin="pauseAutoPlay"
      @focusout="resumeAutoPlay"
    >
      <button
        v-show="showArrows"
        type="button"
        class="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-30"
        :disabled="!canScrollLeft"
        aria-label="เลื่อนรีวิวไปทางซ้าย"
        @click="scrollBy(-1)"
      >
        <Icon name="heroicons:chevron-left" class="h-4 w-4" />
      </button>

      <button
        v-show="showArrows"
        type="button"
        class="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-30"
        :disabled="!canScrollRight"
        aria-label="เลื่อนรีวิวไปทางขวา"
        @click="scrollBy(1)"
      >
        <Icon name="heroicons:chevron-right" class="h-4 w-4" />
      </button>

      <div
        ref="scrollerRef"
        class="flex min-w-0 max-w-full gap-3 overflow-x-auto scroll-smooth px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          v-for="item in experiences"
          :key="item.id"
          class="shrink-0"
          :style="slideStyle"
        >
          <HomeExperienceCard
            :item="item"
            clickable
            @view="openLightbox"
          />
        </div>
      </div>
    </div>

    <ClientOnly>
      <CustomerExperienceLightbox
        v-model:open="lightboxOpen"
        :item="lightboxItem"
        :initial-index="lightboxImageIndex"
      />
    </ClientOnly>
  </section>
</template>
