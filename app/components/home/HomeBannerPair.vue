<script setup lang="ts">
const LINE_EVENT_IMAGE = '/images/add_line_event.webp'

const { lineOaUrl } = useLineOa()
</script>

<template>
  <section class="bg-white">
    <div class="index-container">
      <div class="grid items-stretch bg-white lg:grid-cols-2">
        <img
          :src="LINE_EVENT_IMAGE"
          alt="เพิ่ม Line LG Subscribe Official"
          class="block h-auto w-full max-w-none object-contain object-left"
          loading="lazy"
        >

        <div class="flex flex-col justify-center px-5 py-6 sm:px-8 sm:py-7">
          <p class="text-xs font-semibold uppercase tracking-wide text-[#06C755]">
            Line Official
          </p>
          <h2 class="mt-1.5 text-lg font-bold leading-snug text-gray-900 sm:text-xl">
            สอบถามผ่อนและโปรโมชั่น — ทัก Line ได้ทันที
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-gray-600">
            เพิ่มเพื่อน LG Subscribe Official รับข่าวโปร และให้ทีมช่วยตอบทุกข้อสงสัยก่อนตัดสินใจ
          </p>
          <p class="mt-2 text-sm leading-relaxed text-gray-600">
            เช็คเงื่อนไขผ่อน รายเดือน / รายปี สิทธิ์โปรเฉพาะ และรายละเอียดสินค้า — ทักมาได้เลย ไม่ต้องรอสายคิว
          </p>
          <a
            :href="lineOaUrl || '#'"
            :target="lineOaUrl ? '_blank' : undefined"
            :rel="lineOaUrl ? 'noopener noreferrer' : undefined"
            class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(6,199,85,0.35)] transition hover:bg-[#05b34c] sm:w-auto"
          >
            <Icon name="mdi:chat" class="h-5 w-5 shrink-0" />
            เพิ่ม Line เพื่อสอบถาม
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
