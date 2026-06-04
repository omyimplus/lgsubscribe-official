<script setup lang="ts">
import type { CustomerExperiencePublic } from '~~/shared/types/customerExperience'
import {
  EXPERIENCES_PAGE_PATH,
  customerExperienceImageSrc,
  formatExperienceEventDate,
} from '~~/shared/utils/customerExperienceDisplay'
import { customerExperienceGalleryUrls } from '~~/shared/utils/customerExperienceImages'

const id = useRoute().params.id as string
const { set: setBreadcrumb } = usePageBreadcrumb()

const { data: experience, pending, error } = await useFetch<CustomerExperiencePublic>(
  () => `/api/public/customer-experiences/${id}`,
  { key: `public-experience-${id}` },
)

const galleryUrls = computed(() =>
  customerExperienceGalleryUrls(
    experience.value?.image_urls,
    experience.value?.image_url,
  ),
)

const eventLabel = computed(() =>
  formatExperienceEventDate(experience.value?.event_date),
)

const pageTitle = computed(() => experience.value?.title ?? 'กิจกรรม')

definePageMeta({ layout: 'default' })

watch(
  experience,
  (item) => {
    if (!item) return
    setBreadcrumb([
      { label: 'หน้าแรก', to: '/' },
      { label: 'Customer Experiences', to: EXPERIENCES_PAGE_PATH },
      { label: item.title },
    ])
  },
  { immediate: true },
)

useSeoMeta({
  title: () => `${pageTitle.value} — LG Subscribe`,
  description: () => experience.value?.description ?? 'กิจกรรม LG Subscribe Customer Experiences',
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <main class="index-container py-8 sm:py-12">
      <NuxtLink
        :to="EXPERIENCES_PAGE_PATH"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-[#ea1917]"
      >
        <Icon name="heroicons:arrow-left" class="h-4 w-4" />
        กลับรายการกิจกรรม
      </NuxtLink>

      <div v-if="pending" class="mt-8 space-y-4">
        <div class="h-8 w-2/3 max-w-md animate-pulse rounded-lg bg-gray-200" />
        <div class="flex gap-4 overflow-hidden">
          <div
            v-for="i in 3"
            :key="i"
            class="h-56 w-72 shrink-0 animate-pulse rounded-2xl bg-gray-200 sm:h-72 sm:w-96"
          />
        </div>
      </div>

      <div v-else-if="error || !experience" class="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        ไม่พบกิจกรรมนี้
      </div>

      <template v-else>
        <header class="mt-6">
          <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
            {{ experience.title }}
          </h1>
          <p v-if="eventLabel" class="mt-2 text-sm text-gray-500">
            {{ eventLabel }}
          </p>
          <p v-if="experience.description" class="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-base">
            {{ experience.description }}
          </p>
        </header>

        <section v-if="galleryUrls.length" class="mt-8">
          <p class="mb-3 text-sm font-medium text-gray-700">
            รูปกิจกรรม ({{ galleryUrls.length }})
          </p>
          <div
            class="-mx-4 overflow-x-auto scroll-smooth px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
          >
            <div class="flex w-max min-w-full gap-3 sm:gap-4">
              <figure
                v-for="(url, idx) in galleryUrls"
                :key="`${url}-${idx}`"
                class="shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm"
              >
                <img
                  :src="customerExperienceImageSrc(url)"
                  :alt="`${experience.title} — รูปที่ ${idx + 1}`"
                  class="block h-52 w-auto max-w-[min(85vw,28rem)] object-cover sm:h-64 md:h-80"
                  loading="lazy"
                >
              </figure>
            </div>
          </div>
        </section>

        <p v-else class="mt-8 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-sm text-gray-500">
          ยังไม่มีรูปในกิจกรรมนี้
        </p>
      </template>
    </main>
  </div>
</template>
