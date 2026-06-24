<script setup lang="ts">
import type { ServiceCarePagePublic } from '~~/shared/types/serviceCare'
import {
  SUBSCRIBE_TERMS_DOCS,
  SUBSCRIBE_TERMS_HUB_DESCRIPTION,
  SUBSCRIBE_TERMS_HUB_TITLE,
} from '~~/shared/utils/subscribeTermsContent'
import { SEO_INSTALLMENT } from '~~/shared/utils/siteSeoPresets'

definePageMeta({
  layout: 'default',
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: SUBSCRIBE_TERMS_HUB_TITLE },
  ],
})

useSiteSeoFromPreset(SEO_INSTALLMENT, {
  schema: {
    breadcrumbs: [
      { name: 'หน้าแรก', path: '/' },
      { name: SUBSCRIBE_TERMS_HUB_TITLE },
    ],
  },
})

const { data: serviceCareData } = await useFetch<ServiceCarePagePublic>('/api/public/service-care', {
  key: 'public-service-care',
})

const serviceCare = computed<ServiceCarePagePublic>(() => serviceCareData.value ?? {
  title: 'งานบริการ - LG Service Care',
  items: [],
})
</script>

<template>
  <main class="index-container py-10 sm:py-12">
    <header class="max-w-3xl">
      <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
        {{ SUBSCRIBE_TERMS_HUB_TITLE }}
      </h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
        {{ SUBSCRIBE_TERMS_HUB_DESCRIPTION }}
      </p>
    </header>

    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="doc in SUBSCRIBE_TERMS_DOCS"
        :key="doc.id"
        :to="`/installment/${doc.slug}`"
        class="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#ea1917]/30 hover:shadow-md"
      >
        <div class="flex items-start gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ea1917]/10 text-[#ea1917]">
            <Icon :name="doc.icon" class="h-6 w-6" />
          </span>
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-gray-900 group-hover:text-[#ea1917]">
              {{ doc.shortTitle }}
            </h2>
            <p class="mt-1 text-sm leading-relaxed text-gray-600">
              {{ doc.description }}
            </p>
          </div>
        </div>
        <span class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#ea1917]">
          อ่านรายละเอียด
          <Icon name="heroicons:arrow-right" class="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </NuxtLink>
    </div>

    <InstallmentServiceCareSection :page="serviceCare" />
  </main>
</template>
