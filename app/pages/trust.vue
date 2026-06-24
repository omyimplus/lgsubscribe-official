<script setup lang="ts">
import type { TrustPagePublic } from '~~/shared/types/trustPage'
import { TRUST_KAPOOK_CERT_IMAGE } from '~~/shared/types/trustPage'
import { SEO_TRUST } from '~~/shared/utils/siteSeoPresets'
import LpCareersYoutube from '~/components/careers/LpCareersYoutube.vue'
import TrustPageSlideImages from '~/components/trust/TrustPageSlideImages.vue'

definePageMeta({
  layout: 'default',
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: 'ความน่าเชื่อถือ' },
  ],
})

useSiteSeoFromPreset(SEO_TRUST, {
  schema: {
    pageType: 'AboutPage',
    breadcrumbs: [
      { name: 'หน้าแรก', path: '/' },
      { name: 'ความน่าเชื่อถือ' },
    ],
  },
})

const { data: trustPage } = await useFetch<TrustPagePublic>('/api/public/trust-page', {
  key: 'public-trust-page',
  default: () => ({ body_html: '', slide_images: [], video: null }),
})

const bodyRef = ref<HTMLElement | null>(null)

useEmbeddedVideos(bodyRef, () => trustPage.value?.body_html)

const hasBody = computed(() => Boolean(trustPage.value?.body_html?.trim()))
const hasSlides = computed(() => (trustPage.value?.slide_images?.length ?? 0) > 0)
const trustVideo = computed(() => trustPage.value?.video ?? null)
const hasBottomMedia = computed(() => Boolean(trustVideo.value) || hasSlides.value)
</script>

<template>
  <main>
    <div class="index-container py-10 sm:py-12">
      <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
        ความน่าเชื่อถือ
      </h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
        LG Subscribe ดูแลคุณตลอดอายุสัญญา — รับประกันสินค้าและบริการมาตรฐาน LG
      </p>

      <section
        class="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-2 lg:items-start lg:gap-10 xl:gap-14"
      >
        <figure class="flex justify-center lg:justify-start">
          <img
            :src="TRUST_KAPOOK_CERT_IMAGE"
            alt="ใบรับรอง Kapook — LG Subscribe"
            class="w-full max-w-md rounded-2xl border border-gray-200 bg-white object-contain shadow-sm lg:max-w-none"
            width="800"
            height="600"
            loading="lazy"
          >
        </figure>

        <div
          v-if="hasBody"
          ref="bodyRef"
          class="storefront-rich-html prose prose-sm max-w-none text-gray-700 sm:prose-base"
          v-html="trustPage?.body_html"
        />
      </section>
    </div>

    <template v-if="hasBottomMedia">
      <LpCareersYoutube
        v-if="trustVideo"
        :video-id="trustVideo.video_id"
        :title="trustVideo.title"
        :watch-url="trustVideo.watch_url"
      />

      <div
        v-if="hasSlides"
        class="index-container"
        :class="trustVideo ? 'pb-10 sm:pb-12' : 'py-10 sm:py-12'"
      >
        <TrustPageSlideImages :images="trustPage?.slide_images ?? []" />
      </div>
    </template>

    <div class="index-container pb-10 sm:pb-12">
      <p class="text-sm text-gray-500">
        <NuxtLink to="/contact" class="font-medium text-[#ea1917] hover:underline">ติดต่อเรา</NuxtLink>
        หากต้องการสอบถามเพิ่มเติม
      </p>
    </div>
  </main>
</template>
