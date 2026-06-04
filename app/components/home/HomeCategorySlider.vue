<script setup lang="ts">
import type { HomeCategoryCard } from '~~/shared/types/homeCategory'

const props = defineProps<{
  items: HomeCategoryCard[]
  loading?: boolean
}>()

const scrollerRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const showLoading = computed(() => Boolean(props.loading) && props.items.length === 0)
const showSection = computed(() => showLoading.value || props.items.length > 0)
const showArrows = computed(() => props.items.length > 0)

function updateScrollState() {
  const el = scrollerRef.value
  if (!el) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function scrollBy(direction: -1 | 1) {
  const el = scrollerRef.value
  if (!el) return
  const step = Math.max(200, Math.round(el.clientWidth * 0.65))
  el.scrollBy({ left: direction * step, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollState()
  scrollerRef.value?.addEventListener('scroll', updateScrollState, { passive: true })
  window.addEventListener('resize', updateScrollState)
})

onUnmounted(() => {
  scrollerRef.value?.removeEventListener('scroll', updateScrollState)
  window.removeEventListener('resize', updateScrollState)
})

watch(() => props.items, async () => {
  await nextTick()
  updateScrollState()
}, { deep: true })
</script>

<template>
  <section v-if="showSection" class="bg-white py-6 sm:py-7">
    <div class="index-container overflow-visible">
      <!-- กล่องครอบรวม — ปุ่ม slide ทับขอบซ้าย/ขวา -->
      <div class="relative overflow-visible rounded-2xl border border-gray-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
        <div v-if="showLoading" class="flex gap-6 overflow-hidden sm:gap-8">
          <div
            v-for="i in 7"
            :key="i"
            class="flex w-[5.5rem] shrink-0 flex-col items-center gap-2 sm:w-28"
          >
            <div class="h-20 w-full animate-pulse rounded bg-gray-100 sm:h-24" />
            <div class="h-3 w-12 animate-pulse rounded bg-gray-100" />
          </div>
        </div>

        <template v-else-if="items.length">
          <button
            v-show="showArrows"
            type="button"
            class="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-30"
            :disabled="!canScrollLeft"
            aria-label="เลื่อนหมวดไปทางซ้าย"
            @click="scrollBy(-1)"
          >
            <Icon name="heroicons:chevron-left" class="h-5 w-5" />
          </button>

          <button
            v-show="showArrows"
            type="button"
            class="absolute right-0 top-1/2 z-10 flex h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-30"
            :disabled="!canScrollRight"
            aria-label="เลื่อนหมวดไปทางขวา"
            @click="scrollBy(1)"
          >
            <Icon name="heroicons:chevron-right" class="h-5 w-5" />
          </button>

          <div
            ref="scrollerRef"
            class="flex gap-5 overflow-x-auto px-2 py-0 sm:gap-8 sm:px-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <NuxtLink
              v-for="item in items"
              :key="item.id"
              :to="`/products?category=${item.slug}`"
              class="group flex w-[5.5rem] shrink-0 flex-col items-center sm:w-28"
            >
              <img
                :src="item.imageUrl"
                :alt="item.name"
                class="h-20 w-full object-contain transition group-hover:opacity-90 sm:h-24"
                loading="lazy"
              >
              <span class="mt-1.5 line-clamp-2 text-center text-xs leading-snug text-gray-800 group-hover:text-[#ea1917] sm:text-sm">
                {{ item.name }}
              </span>
            </NuxtLink>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
