<script setup lang="ts">
import { productImageReferrerPolicy } from '~~/shared/utils/productHeroImage'

const props = defineProps<{
  urls: string[]
  productName: string
}>()

const selectedUrl = defineModel<string>('selectedUrl', { required: true })

const itemCount = computed(() => props.urls.length)

const selectedIndex = computed(() => {
  const idx = props.urls.indexOf(selectedUrl.value)
  return idx >= 0 ? idx + 1 : 1
})

const {
  scrollerRef,
  canScrollLeft,
  canScrollRight,
  slideStyle,
  showArrows,
  refreshLayout,
  scrollBy,
} = useIndexHorizontalSlider(itemCount, pdpGalleryThumbnailsVisibleCount, {
  gapPx: 8,
})

function selectUrl(url: string, index: number) {
  selectedUrl.value = url
  scrollThumbIntoView(index, false)
}

function scrollThumbIntoView(index: number, smooth = false) {
  if (!import.meta.client) return
  const scroller = scrollerRef.value
  const thumb = scroller?.children[index] as HTMLElement | undefined
  if (!scroller || !thumb) return

  const padding = 4
  const thumbStart = thumb.offsetLeft
  const thumbEnd = thumbStart + thumb.offsetWidth
  const viewStart = scroller.scrollLeft
  const viewEnd = viewStart + scroller.clientWidth

  if (thumbStart >= viewStart - padding && thumbEnd <= viewEnd + padding) return

  let target = viewStart
  if (thumbStart < viewStart) {
    target = thumbStart
  }
  else if (thumbEnd > viewEnd) {
    target = thumbEnd - scroller.clientWidth
  }

  scroller.scrollTo({
    left: Math.max(0, target),
    behavior: smooth ? 'smooth' : 'auto',
  })
}

watch(() => props.urls, async () => {
  await nextTick()
  refreshLayout()
}, { deep: true })

onMounted(async () => {
  await nextTick()
  refreshLayout()
})
</script>

<template>
  <div v-if="urls.length > 1" class="min-w-0">
    <!-- มือถือ: slide แนวนอน ~3.5 รูปต่อจอ (เห็นขอบรูปถัดไป) -->
    <div class="sm:hidden">
      <div class="mb-2 flex items-center justify-between gap-2 text-xs text-gray-500">
        <span>{{ urls.length }} รูป</span>
        <span class="tabular-nums">{{ selectedIndex }}/{{ urls.length }}</span>
      </div>

      <div class="relative min-w-0">
        <button
          v-show="showArrows"
          type="button"
          class="absolute left-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-30"
          :disabled="!canScrollLeft"
          aria-label="เลื่อนรูปไปทางซ้าย"
          @click="scrollBy(-1)"
        >
          <Icon name="heroicons:chevron-left" class="h-4 w-4" />
        </button>

        <button
          v-show="showArrows"
          type="button"
          class="absolute right-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-30"
          :disabled="!canScrollRight"
          aria-label="เลื่อนรูปไปทางขวา"
          @click="scrollBy(1)"
        >
          <Icon name="heroicons:chevron-right" class="h-4 w-4" />
        </button>

        <div
          ref="scrollerRef"
          class="flex min-w-0 max-w-full gap-2 overflow-x-auto scroll-smooth px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            v-for="(url, idx) in urls"
            :key="`${url}-${idx}`"
            type="button"
            class="aspect-square shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1"
            :class="selectedUrl === url ? 'border-[#ea1917]' : 'border-gray-200'"
            :style="slideStyle"
            :aria-label="`รูปที่ ${idx + 1} จาก ${urls.length}`"
            :aria-current="selectedUrl === url ? 'true' : undefined"
            @click="selectUrl(url, idx)"
          >
            <img
              :src="url"
              class="size-full object-contain"
              :alt="`${productName}-${idx + 1}`"
              width="120"
              height="120"
              loading="lazy"
              decoding="async"
              :referrerpolicy="productImageReferrerPolicy(url)"
            >
          </button>
        </div>
      </div>
    </div>

    <!-- แท็บ/เดสก์ท็อป: grid เต็มความกว้าง -->
    <div class="hidden min-w-0 sm:block">
      <p class="mb-2 text-xs text-gray-500">
        {{ urls.length }} รูป
        <span class="text-gray-400">·</span>
        <span class="tabular-nums">{{ selectedIndex }}/{{ urls.length }}</span>
      </p>

      <div class="grid min-w-0 grid-cols-4 gap-2 lg:grid-cols-5">
        <button
          v-for="(url, idx) in urls"
          :key="`${url}-${idx}`"
          type="button"
          class="aspect-square w-full overflow-hidden rounded-lg border-2 bg-white p-1 transition"
          :class="selectedUrl === url ? 'border-[#ea1917]' : 'border-gray-200 hover:border-gray-300'"
          :aria-label="`รูปที่ ${idx + 1} จาก ${urls.length}`"
          :aria-current="selectedUrl === url ? 'true' : undefined"
          @click="selectedUrl = url"
        >
          <img
            :src="url"
            class="size-full object-contain"
            :alt="`${productName}-${idx + 1}`"
            width="120"
            height="120"
            loading="lazy"
            decoding="async"
            :referrerpolicy="productImageReferrerPolicy(url)"
          >
        </button>
      </div>
    </div>
  </div>
</template>
