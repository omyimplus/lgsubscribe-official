<script setup lang="ts">
import type { CustomerExperiencePublic } from '~~/shared/types/customerExperience'
import {
  EXPERIENCES_PAGE_PATH,
  HOME_EXPERIENCES_SECTION_TITLE,
} from '~~/shared/utils/customerExperienceDisplay'

definePageMeta({
  layout: 'default',
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: 'Customer Experiences' },
  ],
})

useSeoMeta({
  title: `${HOME_EXPERIENCES_SECTION_TITLE} — LG Subscribe`,
  description: 'ภาพบรรยากาศและกิจกรรม LG Subscribe — งานอีเวนต์และประสบการณ์ลูกค้า',
})

const { data: experiences, pending, error } = await useFetch<CustomerExperiencePublic[]>(
  '/api/public/customer-experiences',
  { key: 'public-experiences-all', default: () => [] },
)
</script>

<template>
  <div class="min-h-screen bg-white">
    <main class="index-container py-8 sm:py-12">
      <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
        {{ HOME_EXPERIENCES_SECTION_TITLE }}
      </h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
        รวมกิจกรรมและประสบการณ์จากลูกค้า LG Subscribe
      </p>

      <div v-if="pending" class="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="i in 8"
          :key="i"
          class="aspect-[4/3] animate-pulse rounded-xl bg-gray-200"
        />
      </div>

      <div v-else-if="error" class="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        โหลดไม่สำเร็จ
      </div>

      <p v-else-if="!(experiences?.length)" class="mt-12 text-center text-sm text-gray-500">
        ยังไม่มีกิจกรรมที่เผยแพร่
      </p>

      <div
        v-else
        class="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
      >
        <NuxtLink
          v-for="item in experiences"
          :key="item.id"
          :to="`${EXPERIENCES_PAGE_PATH}/${item.id}`"
          class="block rounded-xl transition hover:ring-2 hover:ring-[#ea1917]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ea1917]"
        >
          <HomeExperienceCard :item="item" />
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
