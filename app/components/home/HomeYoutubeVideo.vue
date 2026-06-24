<script setup lang="ts">
import type { HomeYoutubePublic } from '~~/shared/types/homeYoutube'
import { youtubeThumbnailUrl } from '~~/shared/utils/youtubeEmbed'

const { data: video } = await useFetch<HomeYoutubePublic | null>('/api/public/home-youtube', {
  key: 'public-home-youtube',
  default: () => null,
})

const showSection = computed(() => Boolean(video.value?.video_id))
const playerActive = ref(false)

const thumbnailUrl = computed(() =>
  video.value?.video_id ? youtubeThumbnailUrl(video.value.video_id, 'hqdefault') : '',
)

function activatePlayer() {
  playerActive.value = true
}
</script>

<template>
  <section v-if="showSection && video" class="bg-gray-50 py-10 sm:py-14">
    <div class="index-container">
      <h2 class="text-center text-xl font-bold text-gray-900 sm:text-2xl">
        {{ video.title }}
      </h2>

      <div class="mx-auto mt-6 max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-lg">
        <HomeYoutubePlayer
          v-if="playerActive"
          :video-id="video.video_id"
          :title="video.title"
          :autoplay="video.autoplay"
          :volume="video.default_volume"
        />
        <button
          v-else
          type="button"
          class="group relative block aspect-video w-full cursor-pointer"
          :aria-label="`เล่นวิดีโอ ${video.title}`"
          @click="activatePlayer"
        >
          <img
            v-if="thumbnailUrl"
            :src="thumbnailUrl"
            :alt="video.title"
            class="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          >
          <span class="absolute inset-0 bg-black/25 transition group-hover:bg-black/35" />
          <span class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
            <span class="flex h-16 w-16 items-center justify-center rounded-full bg-[#ea1917] shadow-lg transition group-hover:scale-105">
              <Icon name="heroicons:play" class="ml-1 h-8 w-8" />
            </span>
            <span class="text-sm font-semibold sm:text-base">แตะเพื่อเล่นวิดีโอ</span>
          </span>
        </button>
      </div>

      <p class="mt-4 text-center">
        <a
          :href="video.watch_url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-[#ea1917] hover:underline"
        >
          <Icon name="mdi:youtube" class="h-5 w-5" />
          ดูบน YouTube
        </a>
      </p>
    </div>
  </section>
</template>
