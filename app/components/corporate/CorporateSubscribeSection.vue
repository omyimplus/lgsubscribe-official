<script setup lang="ts">
import {
  CORPORATE_INQUIRY_PATH,
  CORPORATE_PAGE_PATH,
  CORPORATE_SECTION,
} from '~~/shared/utils/corporateSection'

const props = withDefaults(defineProps<{
  variant?: 'home' | 'page'
}>(), {
  variant: 'page',
})

const isHome = computed(() => props.variant === 'home')
</script>

<template>
  <section
    class="bg-white"
    :class="isHome ? 'py-12 sm:py-16' : 'py-14 sm:py-20'"
  >
    <div class="index-container">
      <header class="mx-auto max-w-4xl text-center">
        <p class="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
          <span class="text-[#ea1917]">{{ CORPORATE_SECTION.brand }}</span>
          {{ ' ' }}
          <span class="text-gray-900">{{ CORPORATE_SECTION.tagline }}</span>
        </p>
        <h2
          class="mt-1 text-lg font-semibold leading-snug text-gray-800 sm:text-xl"
        >
          {{ CORPORATE_SECTION.title }}
        </h2>
        <p class="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
          {{ CORPORATE_SECTION.subtitle }}
        </p>
      </header>

      <div
        class="mt-10 grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10"
        :class="isHome ? 'lg:mt-12' : 'lg:mt-14'"
      >
        <div class="flex justify-center lg:justify-start">
          <img
            :src="CORPORATE_SECTION.awardImage"
            alt="LG Superbrands Thailand's Choice 2023"
            class="w-full max-w-sm rounded-lg object-contain sm:max-w-md"
            width="480"
            height="360"
            loading="lazy"
          >
        </div>

        <div class="min-w-0">
          <p class="text-sm leading-relaxed text-gray-700 sm:text-base">
            {{ CORPORATE_SECTION.intro }}
          </p>
          <h3 class="mt-6 text-lg font-bold text-gray-900 sm:text-xl">
            {{ CORPORATE_SECTION.whyTitle }}
          </h3>
          <ul class="mt-4 space-y-3">
            <li
              v-for="item in CORPORATE_SECTION.benefits"
              :key="item.title"
              class="flex gap-3 text-sm leading-relaxed text-gray-700 sm:text-base"
            >
              <span
                class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ea1917]"
                aria-hidden="true"
              />
              <span>
                <strong class="font-semibold text-gray-900">{{ item.title }}:</strong>
                {{ ' ' }}
                {{ item.description }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div
        v-if="isHome"
        class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
      >
        <NuxtLink
          :to="CORPORATE_INQUIRY_PATH"
          class="inline-flex items-center justify-center rounded-full bg-[#ea1917] px-6 py-3 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(234,25,23,0.35)] transition hover:bg-[#d01514]"
        >
          กรอกข้อมูลสำหรับองค์กร
        </NuxtLink>
        <NuxtLink
          :to="CORPORATE_PAGE_PATH"
          class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ea1917] transition hover:underline"
        >
          ดูรายละเอียดลูกค้าองค์กร
          <Icon name="heroicons:arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
