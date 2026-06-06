<script setup lang="ts">
import type { HomeYoutubePublic } from '~~/shared/types/homeYoutube'

const { data: video, pending } = await useFetch<HomeYoutubePublic | null>('/api/public/home-youtube', {
  key: 'public-home-youtube',
  default: () => null,
})

const showSection = computed(() => Boolean(video.value?.video_id))
</script>

<template>
  <section v-if="showSection && video" class="bg-gray-50 py-10 sm:py-14">
    <div class="index-container">
      <h2 class="text-center text-xl font-bold text-gray-900 sm:text-2xl">
        {{ video.title }}
      </h2>

      <div class="mx-auto mt-6 max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-lg">
        <ClientOnly>
          <HomeYoutubePlayer
            :video-id="video.video_id"
            :title="video.title"
            :autoplay="video.autoplay"
            :volume="video.default_volume"
          />
          <template #fallback>
            <div class="flex aspect-video items-center justify-center bg-black text-sm text-white/70">
              กำลังโหลดวิดีโอ...
            </div>
          </template>
        </ClientOnly>
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
