<script setup lang="ts">
import { clampYoutubeVolume } from '~~/shared/utils/youtubeEmbed'
import { loadYoutubeIframeApi } from '~/composables/useYoutubeIframeApi.client'

const props = defineProps<{
  videoId: string
  title: string
  autoplay: boolean
  volume: number
}>()

const mountEl = ref<HTMLDivElement | null>(null)
const showUnmuteHint = ref(false)
let player: YT.Player | null = null

const effectiveVolume = computed(() => clampYoutubeVolume(props.volume))

function applySound(target: YT.Player) {
  target.setVolume(effectiveVolume.value)
  target.unMute()
}

function checkMutedPlayback(target: YT.Player) {
  if (!props.autoplay) return
  window.setTimeout(() => {
    try {
      if (target.isMuted()) showUnmuteHint.value = true
    }
    catch {
      // ignore
    }
  }, 900)
}

async function initPlayer() {
  await loadYoutubeIframeApi()
  if (!mountEl.value || player) return

  player = new YT.Player(mountEl.value, {
    width: '100%',
    height: '100%',
    videoId: props.videoId,
    playerVars: {
      rel: 0,
      modestbranding: 1,
      enablejsapi: 1,
      origin: window.location.origin,
      autoplay: props.autoplay ? 1 : 0,
    },
    events: {
      onReady: (event) => {
        event.target.setVolume(effectiveVolume.value)
        if (props.autoplay) {
          event.target.unMute()
          event.target.playVideo()
          checkMutedPlayback(event.target)
        }
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.PLAYING && props.autoplay) {
          checkMutedPlayback(event.target)
        }
      },
    },
  })
}

function handleUnmute() {
  if (!player) return
  applySound(player)
  player.playVideo()
  showUnmuteHint.value = false
}

onMounted(() => {
  void initPlayer()
})

onBeforeUnmount(() => {
  try {
    player?.destroy()
  }
  catch {
    // ignore
  }
  player = null
})
</script>

<template>
  <div class="relative aspect-video w-full bg-black">
    <div ref="mountEl" class="absolute inset-0 h-full w-full" :title="title" />
    <button
      v-if="showUnmuteHint"
      type="button"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50 px-4 text-white transition hover:bg-black/60"
      @click="handleUnmute"
    >
      <Icon name="heroicons:speaker-wave" class="h-10 w-10" />
      <span class="text-sm font-semibold">แตะเพื่อเปิดเสียง</span>
      <span class="text-xs text-white/80">ระดับเสียง {{ effectiveVolume }}%</span>
    </button>
  </div>
</template>
