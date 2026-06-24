<script setup lang="ts">
import type { CustomerExperiencePublic } from '~~/shared/types/customerExperience'
import {
  customerExperienceImageSrc,
  formatExperienceEventDate,
} from '~~/shared/utils/customerExperienceDisplay'
import { customerExperienceGalleryUrls } from '~~/shared/utils/customerExperienceImages'

const props = defineProps<{
  open: boolean
  item: CustomerExperiencePublic | null
  initialIndex?: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const imageIndex = ref(0)

const galleryUrls = computed(() =>
  props.item
    ? customerExperienceGalleryUrls(props.item.image_urls, props.item.image_url)
    : [],
)

const currentUrl = computed(() => galleryUrls.value[imageIndex.value] ?? null)
const hasMultiple = computed(() => galleryUrls.value.length > 1)

function close() {
  emit('update:open', false)
}

function onDialogClose() {
  emit('update:open', false)
  if (import.meta.client) document.body.style.overflow = ''
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === dialogRef.value) close()
}

function syncDialogOpenState() {
  if (!import.meta.client) return
  const el = dialogRef.value
  if (!el) return

  if (props.open) {
    if (!el.open) el.showModal()
    document.body.style.overflow = 'hidden'
  }
  else {
    if (el.open) el.close()
    document.body.style.overflow = ''
  }
}

function goPrev() {
  const len = galleryUrls.value.length
  if (len <= 1) return
  imageIndex.value = (imageIndex.value - 1 + len) % len
}

function goNext() {
  const len = galleryUrls.value.length
  if (len <= 1) return
  imageIndex.value = (imageIndex.value + 1) % len
}

function goToIndex(index: number) {
  if (index < 0 || index >= galleryUrls.value.length) return
  imageIndex.value = index
}

function onKeydown(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goPrev()
  }
  else if (e.key === 'ArrowRight') {
    e.preventDefault()
    goNext()
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    const max = Math.max(0, galleryUrls.value.length - 1)
    imageIndex.value = Math.min(Math.max(0, props.initialIndex ?? 0), max)
    if (import.meta.client) window.addEventListener('keydown', onKeydown)
  }
  else if (import.meta.client) {
    window.removeEventListener('keydown', onKeydown)
  }
  nextTick(syncDialogOpenState)
}, { flush: 'post' })

watch(() => props.item?.id, () => {
  imageIndex.value = Math.min(Math.max(0, props.initialIndex ?? 0), Math.max(0, galleryUrls.value.length - 1))
})

onMounted(() => nextTick(syncDialogOpenState))

onBeforeUnmount(() => {
  dialogRef.value?.close()
  if (import.meta.client) {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <dialog
    ref="dialogRef"
    class="experience-lightbox"
    :aria-labelledby="open && item ? 'experience-lightbox-title' : undefined"
    @close="onDialogClose"
    @cancel.prevent="onDialogClose"
    @click="onBackdropClick"
  >
    <div v-if="item" class="experience-lightbox__panel" @click.stop>
      <div class="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
        <div class="min-w-0 pr-2">
          <h2 id="experience-lightbox-title" class="text-base font-semibold text-gray-900 sm:text-lg">
            {{ item.title }}
          </h2>
          <p
            v-if="formatExperienceEventDate(item.event_date)"
            class="mt-0.5 text-xs text-gray-500 sm:text-sm"
          >
            {{ formatExperienceEventDate(item.event_date) }}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          aria-label="ปิด"
          @click="close"
        >
          <Icon name="heroicons:x-mark" class="h-5 w-5" />
        </button>
      </div>

      <div class="relative flex min-h-0 flex-1 items-center justify-center bg-gray-950 px-4 py-4 sm:px-6 sm:py-6">
        <button
          v-if="hasMultiple"
          type="button"
          class="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:left-4 sm:h-10 sm:w-10"
          aria-label="รูปก่อนหน้า"
          @click="goPrev"
        >
          <Icon name="heroicons:chevron-left" class="h-5 w-5" />
        </button>

        <button
          v-if="hasMultiple"
          type="button"
          class="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:right-4 sm:h-10 sm:w-10"
          aria-label="รูปถัดไป"
          @click="goNext"
        >
          <Icon name="heroicons:chevron-right" class="h-5 w-5" />
        </button>

        <Transition
          v-if="currentUrl"
          mode="out-in"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <img
            :key="currentUrl"
            :src="customerExperienceImageSrc(currentUrl)"
            :alt="item.title"
            class="max-h-[min(70vh,720px)] max-w-full object-contain"
            decoding="async"
          >
        </Transition>

        <div
          v-else
          class="flex aspect-[4/3] w-full max-w-md items-center justify-center text-gray-500"
        >
          <Icon name="heroicons:photo" class="h-16 w-16" />
        </div>

        <div
          v-if="hasMultiple"
          class="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
        >
          {{ imageIndex + 1 }}/{{ galleryUrls.length }}
        </div>
      </div>

      <div
        v-if="hasMultiple"
        class="flex gap-2 overflow-x-auto border-t border-gray-100 px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
      >
        <button
          v-for="(url, idx) in galleryUrls"
          :key="`${url}-${idx}`"
          type="button"
          class="shrink-0 overflow-hidden rounded-lg border-2 bg-gray-100 transition"
          :class="idx === imageIndex ? 'border-[#ea1917] ring-1 ring-[#ea1917]/30' : 'border-transparent opacity-70 hover:opacity-100'"
          :aria-label="`ดูรูปที่ ${idx + 1}`"
          :aria-current="idx === imageIndex ? 'true' : undefined"
          @click="goToIndex(idx)"
        >
          <img
            :src="customerExperienceImageSrc(url)"
            :alt="`${item.title} — รูปที่ ${idx + 1}`"
            class="block h-14 w-14 object-cover sm:h-16 sm:w-16"
            loading="lazy"
            decoding="async"
          >
        </button>
      </div>

      <p
        v-if="item.description"
        class="max-h-32 overflow-y-auto border-t border-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-600 sm:px-5"
      >
        {{ item.description }}
      </p>
    </div>
  </dialog>
</template>

<style scoped>
.experience-lightbox {
  position: fixed;
  inset: 0;
  z-index: 60;
  margin: auto;
  max-width: min(56rem, calc(100vw - 1rem));
  width: 100%;
  border: none;
  padding: 0;
  background: transparent;
}

.experience-lightbox::backdrop {
  background: rgb(17 24 39 / 0.65);
  backdrop-filter: blur(2px);
}

.experience-lightbox__panel {
  display: flex;
  max-height: calc(100vh - 1rem);
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.35);
}
</style>
