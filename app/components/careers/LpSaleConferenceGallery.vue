<script setup lang="ts">
import {
  SALE_CONFERENCE_IMAGES,
  SALE_CONFERENCE_SECTION,
} from '~~/shared/utils/saleConferenceGallery'

const PREVIEW_ROWS = 3

const images = SALE_CONFERENCE_IMAGES
const title = SALE_CONFERENCE_SECTION.title
const subtitle = SALE_CONFERENCE_SECTION.subtitle

const expanded = ref(false)
const lightboxOpen = ref(false)
const imageIndex = ref(0)
const dialogRef = ref<HTMLDialogElement | null>(null)
const cols = ref(2)

const previewLimit = computed(() => cols.value * PREVIEW_ROWS)
const visibleImages = computed(() =>
  expanded.value ? images : images.slice(0, previewLimit.value),
)
const hasMore = computed(() => images.length > previewLimit.value)

const currentSrc = computed(() => images[imageIndex.value] ?? '')
const hasMultiple = computed(() => images.length > 1)

function syncCols() {
  if (!import.meta.client) return
  const w = window.innerWidth
  if (w >= 1024) cols.value = 5
  else if (w >= 768) cols.value = 4
  else if (w >= 640) cols.value = 3
  else cols.value = 2
}

function openAt(index: number) {
  imageIndex.value = index
  lightboxOpen.value = true
}

function close() {
  lightboxOpen.value = false
}

function goPrev() {
  if (!hasMultiple.value) return
  imageIndex.value = (imageIndex.value - 1 + images.length) % images.length
}

function goNext() {
  if (!hasMultiple.value) return
  imageIndex.value = (imageIndex.value + 1) % images.length
}

function onKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goPrev()
  }
  else if (e.key === 'ArrowRight') {
    e.preventDefault()
    goNext()
  }
  else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

function syncDialog() {
  if (!import.meta.client) return
  const el = dialogRef.value
  if (!el) return
  if (lightboxOpen.value) {
    if (!el.open) el.showModal()
    document.body.style.overflow = 'hidden'
  }
  else {
    if (el.open) el.close()
    document.body.style.overflow = ''
  }
}

watch(lightboxOpen, () => nextTick(syncDialog))

onMounted(() => {
  syncCols()
  window.addEventListener('resize', syncCols)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncCols)
  window.removeEventListener('keydown', onKeydown)
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <section class="border-b border-gray-100 bg-white">
    <div class="index-container py-10 sm:py-12">
      <h2 class="text-center text-xl font-bold leading-snug text-gray-900 sm:text-2xl">
        {{ title }}
      </h2>
      <p class="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-gray-600 sm:text-base">
        {{ subtitle }}
      </p>

      <div class="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
        <button
          v-for="(src, idx) in visibleImages"
          :key="src"
          type="button"
          class="group relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ea1917]"
          :aria-label="`ดูรูป Sale Conference รูปที่ ${idx + 1}`"
          @click="openAt(idx)"
        >
          <img
            :src="src"
            :alt="`Sale Conference GM005 — รูปที่ ${idx + 1}`"
            class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            width="400"
            height="300"
          >
        </button>
      </div>

      <div v-if="hasMore" class="mt-6 flex justify-center">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
          @click="expanded = !expanded"
        >
          {{ expanded ? 'ย่อรูป' : 'ดูเพิ่มเติม' }}
          <Icon
            :name="expanded ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
            class="h-4 w-4"
          />
        </button>
      </div>
    </div>

    <ClientOnly>
      <dialog
        ref="dialogRef"
        class="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-black/90 p-0 text-white open:flex open:flex-col"
        @close="close"
        @click="(e) => { if (e.target === dialogRef) close() }"
      >
        <div class="flex items-center justify-between px-4 py-3 sm:px-6">
          <p class="text-sm text-white/80">
            {{ imageIndex + 1 }} / {{ images.length }}
          </p>
          <button
            type="button"
            class="rounded-full p-2 text-white/90 hover:bg-white/10"
            aria-label="ปิด"
            @click="close"
          >
            <Icon name="heroicons:x-mark" class="h-6 w-6" />
          </button>
        </div>

        <div class="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-12">
          <button
            v-if="hasMultiple"
            type="button"
            class="absolute left-2 z-10 rounded-full bg-black/40 p-2 hover:bg-black/60 sm:left-4"
            aria-label="รูปก่อนหน้า"
            @click.stop="goPrev"
          >
            <Icon name="heroicons:chevron-left" class="h-7 w-7" />
          </button>

          <img
            v-if="currentSrc"
            :src="currentSrc"
            :alt="`Sale Conference GM005 — รูปที่ ${imageIndex + 1}`"
            class="max-h-[80vh] max-w-full object-contain"
          >

          <button
            v-if="hasMultiple"
            type="button"
            class="absolute right-2 z-10 rounded-full bg-black/40 p-2 hover:bg-black/60 sm:right-4"
            aria-label="รูปถัดไป"
            @click.stop="goNext"
          >
            <Icon name="heroicons:chevron-right" class="h-7 w-7" />
          </button>
        </div>
      </dialog>
    </ClientOnly>
  </section>
</template>
