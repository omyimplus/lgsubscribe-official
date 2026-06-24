<script setup lang="ts">
import type { LpApplicationInput } from '~~/shared/types/lpApplication'
import type { LpCareersPagePublic } from '~~/shared/types/lpCareersPage'
import { LP_CAREERS_SECTION } from '~~/shared/utils/lpApplicationContent'
import { SEO_CAREERS } from '~~/shared/utils/siteSeoPresets'
import LpApplicationForm from '~/components/careers/LpApplicationForm.vue'
import LpCareersSlideShow from '~/components/careers/LpCareersSlideShow.vue'
import LpCareersYoutube from '~/components/careers/LpCareersYoutube.vue'

definePageMeta({
  layout: 'default',
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: 'สมัคร LP' },
  ],
})

useSiteSeoFromPreset(SEO_CAREERS, {
  description: LP_CAREERS_SECTION.title,
})

const { data: careersPage } = await useFetch<LpCareersPagePublic>('/api/public/lp-careers-page', {
  key: 'public-lp-careers-page',
  default: () => ({ slide_images: [], video: null }),
})

const hasSlides = computed(() => (careersPage.value?.slide_images?.length ?? 0) > 0)
const careersVideo = computed(() => careersPage.value?.video ?? null)

const submitting = ref(false)
const error = ref('')
const success = ref(false)

async function handleSubmit(payload: LpApplicationInput) {
  error.value = ''
  submitting.value = true
  try {
    await $fetch('/api/public/lp-applications', {
      method: 'POST',
      body: payload,
    })
    success.value = true
  }
  catch (err: any) {
    error.value = err?.data?.message ?? 'ส่งใบสมัครไม่สำเร็จ'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <section class="border-b border-gray-100 bg-white">
      <div class="index-container py-10 sm:py-12">
        <p class="text-sm font-semibold text-[#ea1917]">
          {{ LP_CAREERS_SECTION.sectionTitle }}
        </p>
        <h1 class="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          {{ LP_CAREERS_SECTION.title }}
        </h1>
        <p class="mt-2 text-sm text-gray-600">
          {{ LP_CAREERS_SECTION.roleTitle }}
        </p>
      </div>
    </section>

    <LpCareersYoutube
      v-if="careersVideo"
      :video-id="careersVideo.video_id"
      :title="careersVideo.title"
      :watch-url="careersVideo.watch_url"
    />
    <LpCareersSlideShow v-if="hasSlides" :images="careersPage?.slide_images ?? []" />

    <main class="index-container max-w-3xl py-8 sm:py-12">
      <template v-if="success">
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <Icon name="heroicons:check-circle" class="mx-auto h-12 w-12 text-emerald-600" />
          <h2 class="mt-3 text-xl font-bold text-gray-900">
            ส่งใบสมัครแล้ว
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            ทีมงานจะติดต่อกลับตามเวลาที่คุณระบุ — ขอบคุณที่สนใจร่วมงานกับ LG Subscribe
          </p>
          <NuxtLink
            to="/"
            class="mt-6 inline-flex rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            กลับหน้าแรก
          </NuxtLink>
        </div>
      </template>

      <template v-else>
        <div class="mb-6 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
          <ul class="space-y-2">
            <li
              v-for="item in LP_CAREERS_SECTION.qualifications"
              :key="item"
              class="flex gap-2"
            >
              <span class="text-[#06C755]">✅</span>
              <span>{{ item }}</span>
            </li>
          </ul>
          <p class="mt-4 font-semibold text-gray-800">
            **{{ LP_CAREERS_SECTION.salesNote }}**
          </p>
          <p class="mt-3 rounded-lg bg-[#ea1917] px-4 py-3 text-white">
            ***{{ LP_CAREERS_SECTION.scamWarning }}***
          </p>
        </div>

        <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <LpApplicationForm
            :submitting="submitting"
            :error="error"
            @submit="handleSubmit"
          />
        </section>
      </template>
    </main>
  </div>
</template>
