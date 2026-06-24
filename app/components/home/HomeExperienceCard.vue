<script setup lang="ts">
import type { CustomerExperiencePublic } from '~~/shared/types/customerExperience'
import {
  customerExperienceImageSrc,
  formatExperienceEventDate,
} from '~~/shared/utils/customerExperienceDisplay'
import { customerExperienceGalleryUrls } from '~~/shared/utils/customerExperienceImages'

const props = withDefaults(
  defineProps<{
    item: CustomerExperiencePublic
    /** กดรูปเพื่อเปิดดูใหญ่ (เช่น บล็อกรีวิวบน PDP) */
    clickable?: boolean
  }>(),
  { clickable: false },
)

const emit = defineEmits<{
  view: [payload: { item: CustomerExperiencePublic, imageIndex: number }]
}>()

const SLIDE_MS = 4000

const galleryUrls = computed(() =>
  customerExperienceGalleryUrls(props.item.image_urls, props.item.image_url),
)

const slideIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startTimer() {
  if (!import.meta.client) return
  clearTimer()
  if (galleryUrls.value.length <= 1) return
  timer = setInterval(() => {
    slideIndex.value = (slideIndex.value + 1) % galleryUrls.value.length
  }, SLIDE_MS)
}

watch(galleryUrls, () => {
  slideIndex.value = 0
  startTimer()
})

onMounted(startTimer)
onUnmounted(clearTimer)

const currentUrl = computed(() => galleryUrls.value[slideIndex.value] ?? null)
</script>

<template>
  <article class="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <component
      :is="clickable && currentUrl ? 'button' : 'div'"
      type="button"
      class="relative block aspect-[4/3] w-full bg-gray-100 text-left"
      :class="clickable && currentUrl ? 'cursor-zoom-in transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ea1917] focus-visible:ring-offset-2' : ''"
      :aria-label="clickable && currentUrl ? `ดูรูปใหญ่: ${item.title}` : undefined"
      @click="clickable && currentUrl ? emit('view', { item, imageIndex: slideIndex }) : undefined"
    >
      <Transition
        v-if="currentUrl"
        mode="out-in"
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="opacity-0 scale-[1.02]"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <img
          :key="currentUrl"
          :src="customerExperienceImageSrc(currentUrl)"
          :alt="item.title"
          class="size-full object-cover"
          loading="lazy"
        >
      </Transition>
      <div
        v-else
        class="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 p-4"
      >
        <Icon name="heroicons:user-group" class="h-10 w-10 text-gray-400" />
      </div>

      <div
        v-if="galleryUrls.length > 1"
        class="pointer-events-none absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
      >
        {{ slideIndex + 1 }}/{{ galleryUrls.length }}
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-3 pb-3 pt-10"
      >
        <p class="line-clamp-2 text-sm font-semibold text-white">
          {{ item.title }}
        </p>
        <p
          v-if="formatExperienceEventDate(item.event_date)"
          class="mt-0.5 text-xs text-white/80"
        >
          {{ formatExperienceEventDate(item.event_date) }}
        </p>
      </div>
    </component>
    <p
      v-if="item.description"
      class="line-clamp-2 px-3 py-2.5 text-xs text-gray-600 sm:text-sm"
    >
      {{ item.description }}
    </p>
  </article>
</template>
