<script setup lang="ts">
import { SEO_TRUST } from '~~/shared/utils/siteSeoPresets'

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
</script>

<template>
  <main class="index-container py-10 sm:py-12">
    <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
      ความน่าเชื่อถือ
    </h1>
    <p class="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
      LG Subscribe ดูแลคุณตลอดอายุสัญญา — รับประกันสินค้าและบริการมาตรฐาน LG
    </p>
    <ul class="mt-8 space-y-4 text-sm text-gray-700 sm:text-base">
      <li class="flex gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <Icon name="heroicons:shield-check" class="mt-0.5 h-6 w-6 shrink-0 text-[#ea1917]" />
        <span>รับประกันสินค้าตามเงื่อนไข LG ตลอดระยะสัญญา Subscribe</span>
      </li>
      <li class="flex gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <Icon name="heroicons:wrench-screwdriver" class="mt-0.5 h-6 w-6 shrink-0 text-[#ea1917]" />
        <span>บริการซ่อมบำรุงและดูแลโดยทีมช่างมืออาชีพ</span>
      </li>
      <li class="flex gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <Icon name="heroicons:building-office-2" class="mt-0.5 h-6 w-6 shrink-0 text-[#ea1917]" />
        <span>แบรนด์ LG — นวัตกรรมและคุณภาพที่ไว้ใจได้ในทุกบ้าน</span>
      </li>
    </ul>
    <p class="mt-10 text-sm text-gray-500">
      <NuxtLink to="/contact" class="font-medium text-[#ea1917] hover:underline">ติดต่อเรา</NuxtLink>
      หากต้องการสอบถามเพิ่มเติม
    </p>
  </main>
</template>
