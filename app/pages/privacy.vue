<script setup lang="ts">
import { PRIVACY_POLICY_SECTIONS, PRIVACY_POLICY_UPDATED } from '~~/shared/utils/privacyPolicyContent'
import { SEO_PRIVACY } from '~~/shared/utils/siteSeoPresets'

definePageMeta({
  layout: 'default',
  showHero: false,
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: 'นโยบายความเป็นส่วนตัว' },
  ],
})

useSiteSeoFromPreset(SEO_PRIVACY, {
  schema: {
    breadcrumbs: [
      { name: 'หน้าแรก', path: '/' },
      { name: 'นโยบายความเป็นส่วนตัว' },
    ],
  },
})
</script>

<template>
  <main class="index-container py-10 sm:py-12">
    <header class="max-w-3xl">
      <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
        นโยบายความเป็นส่วนตัว
      </h1>
      <p class="mt-2 text-sm text-gray-500">
        อัปเดตล่าสุด: {{ PRIVACY_POLICY_UPDATED }}
      </p>
      <p class="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
        นโยบายนี้ใช้กับเว็บไซต์ LG Subscribe ครอบคลุมการคุ้มครองข้อมูลส่วนบุคคลตาม PDPA และนโยบายการใช้คุกกี้
      </p>
    </header>

    <div class="mt-8 max-w-3xl space-y-8">
      <section
        v-for="section in PRIVACY_POLICY_SECTIONS"
        :key="section.title"
        class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <h2 class="text-lg font-semibold text-gray-900">
          {{ section.title }}
        </h2>
        <p
          v-for="(paragraph, i) in section.paragraphs"
          :key="`${section.title}-p-${i}`"
          class="mt-3 text-sm leading-relaxed text-gray-700 sm:text-base"
        >
          <template v-if="section.title.startsWith('11.') && i === section.paragraphs.length - 1">
            หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวหรือการใช้คุกกี้ โปรดติดต่อ LG Subscribe ผ่าน
            <NuxtLink to="/contact" class="font-medium text-[#ea1917] hover:underline">หน้าติดต่อเรา</NuxtLink>
          </template>
          <template v-else>
            {{ paragraph }}
          </template>
        </p>
        <ul
          v-if="section.bullets?.length"
          class="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-700 sm:text-base"
        >
          <li v-for="item in section.bullets" :key="item">
            {{ item }}
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>
