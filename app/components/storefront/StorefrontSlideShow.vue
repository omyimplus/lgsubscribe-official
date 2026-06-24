<script setup lang="ts">
const props = withDefaults(defineProps<{
  images: string[]
  altPrefix?: string
  fit?: 'cover' | 'contain'
  variant?: 'section' | 'inline'
  perSlide?: number
}>(), {
  altPrefix: 'ภาพสไลด์',
  fit: 'cover',
  variant: 'section',
  perSlide: 3,
})

const SLIDE_MS = 4500

const pageIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const pageCount = computed(() => Math.max(1, Math.ceil(props.images.length / props.perSlide)))
const hasMultiplePages = computed(() => pageCount.value > 1)

const currentPageImages = computed(() => {
  const start = pageIndex.value * props.perSlide
  return props.images.slice(start, start + props.perSlide)
})

const imageClass = computed(() => {
  if (props.fit === 'contain') {
    return 'mx-auto block h-full w-full max-h-56 object-contain sm:max-h-72'
  }
  return 'aspect-[16/9] w-full rounded-lg object-cover'
})

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startTimer() {
  if (!import.meta.client) return
  clearTimer()
  if (!hasMultiplePages.value) return
  timer = setInterval(() => {
    pageIndex.value = (pageIndex.value + 1) % pageCount.value
  }, SLIDE_MS)
}

function goToPage(index: number) {
  pageIndex.value = index
  startTimer()
}

watch(() => props.images, () => {
  pageIndex.value = 0
  startTimer()
}, { deep: true })

onMounted(startTimer)
onUnmounted(clearTimer)
</script>

<template>
  <component
    :is="variant === 'section' ? 'section' : 'div'"
    v-if="images.length"
    :class="variant === 'section' ? 'border-b border-gray-100 bg-white' : undefined"
  >
    <div :class="variant === 'section' ? 'index-container py-6 sm:py-8' : undefined">
      <div
        class="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm"
        :class="variant === 'section' ? 'mx-auto max-w-5xl' : 'w-full'"
      >
        <Transition
          mode="out-in"
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-300 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            :key="pageIndex"
            class="grid grid-cols-1 gap-2 p-2 sm:grid-cols-3 sm:gap-4 sm:p-4"
          >
            <figure
              v-for="(url, index) in currentPageImages"
              :key="`${pageIndex}-${url}`"
              class="flex min-h-0 items-center justify-center overflow-hidden rounded-lg bg-white"
              :class="fit === 'cover' ? '' : 'min-h-48 sm:min-h-64'"
            >
              <img
                :src="url"
                :alt="`${altPrefix} ${pageIndex * perSlide + index + 1}`"
                :class="imageClass"
                loading="lazy"
                decoding="async"
              >
            </figure>
          </div>
        </Transition>

        <div
          v-if="hasMultiplePages"
          class="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
        >
          {{ pageIndex + 1 }}/{{ pageCount }}
        </div>

        <div
          v-if="hasMultiplePages"
          class="absolute inset-x-0 bottom-3 flex justify-center gap-2"
        >
          <button
            v-for="page in pageCount"
            :key="page"
            type="button"
            class="h-2 rounded-full transition"
            :class="page - 1 === pageIndex ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'"
            :aria-label="`ไปสไลด์หน้า ${page}`"
            @click="goToPage(page - 1)"
          />
        </div>
      </div>
    </div>
  </component>
</template>
