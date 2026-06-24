<script setup lang="ts">
import { youtubeThumbnailUrl } from '~~/shared/utils/youtubeEmbed'

const props = defineProps<{
  videoId: string
  title: string
  watchUrl: string
}>()

const playerActive = ref(false)

const thumbnailUrl = computed(() => youtubeThumbnailUrl(props.videoId, 'hqdefault'))

function activatePlayer() {
  playerActive.value = true
}
</script>

<template>
  <section class="border-b border-gray-100 bg-gray-50">
    <div class="index-container py-6 sm:py-8">
      <div class="mx-auto max-w-4xl">
        <h2 class="mb-4 text-center text-lg font-bold text-gray-900 sm:text-xl">
          {{ title }}
        </h2>
        <div class="overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-lg">
          <HomeYoutubePlayer
            v-if="playerActive"
            :video-id="videoId"
            :title="title"
            :autoplay="true"
            :volume="40"
          />
          <button
            v-else
            type="button"
            class="group relative block aspect-video w-full cursor-pointer"
            :aria-label="`เล่นวิดีโอ ${title}`"
            @click="activatePlayer"
          >
            <img
              v-if="thumbnailUrl"
              :src="thumbnailUrl"
              :alt="title"
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
  </section>
</template>
