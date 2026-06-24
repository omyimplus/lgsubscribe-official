<script setup lang="ts">
import { youtubeWatchUrl } from '~~/shared/utils/youtubeEmbed'

const props = defineProps<{
  open: boolean
  videoId: string
  title: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const playerKey = ref(0)

const watchUrl = computed(() => youtubeWatchUrl(props.videoId))

function close() {
  emit('update:open', false)
}

function onDialogClose() {
  emit('update:open', false)
  playerKey.value += 1
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

watch(() => props.open, () => nextTick(syncDialogOpenState), { flush: 'post' })
watch(() => props.videoId, () => {
  playerKey.value += 1
})

onMounted(() => nextTick(syncDialogOpenState))

onBeforeUnmount(() => {
  dialogRef.value?.close()
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <dialog
    ref="dialogRef"
    class="youtube-video-modal"
    :aria-labelledby="open ? 'youtube-video-modal-title' : undefined"
    @close="onDialogClose"
    @cancel.prevent="onDialogClose"
    @click="onBackdropClick"
  >
    <div class="youtube-video-modal__panel" @click.stop>
      <div class="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
        <h2 id="youtube-video-modal-title" class="pr-2 text-base font-semibold text-gray-900 sm:text-lg">
          {{ title }}
        </h2>
        <button
          type="button"
          class="shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          aria-label="ปิด"
          @click="close"
        >
          <Icon name="heroicons:x-mark" class="h-5 w-5" />
        </button>
      </div>

      <div class="youtube-video-modal__body px-4 py-4 sm:px-5">
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-black shadow-sm">
          <HomeYoutubePlayer
            v-if="open"
            :key="playerKey"
            :video-id="videoId"
            :title="title"
            :autoplay="true"
            :volume="40"
          />
        </div>
        <p class="mt-3 text-center">
          <a
            :href="watchUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-sm font-medium text-[#ea1917] hover:underline"
          >
            <Icon name="mdi:youtube" class="h-5 w-5" />
            ดูบน YouTube
          </a>
        </p>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.youtube-video-modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  margin: auto;
  max-width: min(56rem, calc(100vw - 2rem));
  width: 100%;
  border: none;
  padding: 0;
  background: transparent;
}

.youtube-video-modal::backdrop {
  background: rgb(17 24 39 / 0.55);
  backdrop-filter: blur(2px);
}

.youtube-video-modal__panel {
  display: flex;
  max-height: calc(100vh - 2rem);
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}

.youtube-video-modal__body {
  overflow-y: auto;
}
</style>
