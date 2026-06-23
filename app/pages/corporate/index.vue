<script setup lang="ts">
import { CORPORATE_INQUIRY_PATH, CORPORATE_SECTION } from '~~/shared/utils/corporateSection'

definePageMeta({
  layout: 'default',
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: 'ลูกค้าองค์กร' },
  ],
})

useSeoMeta({
  title: 'ลูกค้าองค์กร — LG Subscribe',
  description: `${CORPORATE_SECTION.subtitle} — ${CORPORATE_SECTION.intro}`,
})
</script>

<template>
  <main>
    <CorporateSubscribeSection variant="page" />

    <section class="bg-gray-50 py-10 sm:py-12">
      <div class="index-container">
        <div class="mx-auto max-w-3xl text-center">
          <h2 class="text-xl font-bold text-gray-900 sm:text-2xl">
            สนใจสมัคร LG Subscribe สำหรับองค์กร?
          </h2>
          <p class="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
            กรอกแบบฟอร์มสนใจผ่อนแบบนิติบุคคล ทีมงานจะติดต่อกลับเพื่อให้คำปรึกษาแผนรายเดือนที่เหมาะกับธุรกิจของคุณ
          </p>
          <div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <NuxtLink
              :to="CORPORATE_INQUIRY_PATH"
              class="inline-flex items-center justify-center rounded-full bg-[#ea1917] px-6 py-3 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(234,25,23,0.35)] transition hover:bg-[#d01514]"
            >
              กรอกข้อมูลสำหรับองค์กร
            </NuxtLink>
            <NuxtLink
              to="/contact"
              class="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:border-gray-300 hover:bg-gray-50"
            >
              ติดต่อเรา
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
