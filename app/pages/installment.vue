<script setup lang="ts">
import { SEO_INSTALLMENT } from '~~/shared/utils/siteSeoPresets'

definePageMeta({
  layout: 'default',
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: 'เงื่อนไขการผ่อน' },
  ],
})

useSiteSeoFromPreset(SEO_INSTALLMENT, {
  schema: {
    breadcrumbs: [
      { name: 'หน้าแรก', path: '/' },
      { name: 'เงื่อนไขการผ่อน' },
    ],
  },
})
</script>

<template>
  <main class="index-container py-10 sm:py-12">
    <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
      เงื่อนไขการผ่อน
    </h1>
    <p class="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
      เริ่มใช้เครื่องใช้ไฟฟ้า LG ได้ง่ายๆ ด้วยค่าบริการรายเดือนที่ชัดเจน
    </p>
    <ul class="mt-8 space-y-4 text-sm text-gray-700 sm:text-base">
      <li class="flex gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <Icon name="heroicons:currency-dollar" class="mt-0.5 h-6 w-6 shrink-0 text-[#ea1917]" />
        <span>ค่าบริการรายเดือนตามแผนที่เลือก — ดูรายละเอียดได้ที่หน้าสินค้าแต่ละรุ่น</span>
      </li>
      <li class="flex gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <Icon name="heroicons:calendar-days" class="mt-0.5 h-6 w-6 shrink-0 text-[#ea1917]" />
        <span>เลือกระยะสัญญาและแผนผ่อนที่เหมาะกับคุณก่อนสมัคร</span>
      </li>
      <li class="flex gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <Icon name="heroicons:shopping-bag" class="mt-0.5 h-6 w-6 shrink-0 text-[#ea1917]" />
        <span>
          <NuxtLink to="/products" class="font-medium text-[#ea1917] hover:underline">เลือกสินค้า</NuxtLink>
          แล้วกดสนใจผ่อนเพื่อให้ทีมงานติดต่อกลับ
        </span>
      </li>
    </ul>
  </main>
</template>
