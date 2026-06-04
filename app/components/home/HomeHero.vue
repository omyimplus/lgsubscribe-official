<script setup lang="ts">
const bullets = [
  'นวัตกรรมสุดล้ำและดีไซน์พรีเมียม',
  'แบ่งชำระรายเดือน ราคาสบายๆ',
  'ดูแลและรับประกันตลอดอายุสัญญา',
]
</script>

<template>
  <section class="relative w-full overflow-hidden bg-gray-100">
    <div class="absolute inset-0" aria-hidden="true">
      <img
        src="/images/bg-hero-section.webp"
        alt=""
        class="h-full w-full object-cover object-center"
        width="1920"
        height="640"
        fetchpriority="high"
      >
    </div>

    <div class="index-container relative flex min-h-[calc(22rem-30px)] items-center py-8 sm:min-h-[calc(26rem-30px)] sm:py-12 lg:min-h-[calc(32rem-30px)] lg:py-16">
      <div
        class="max-w-xl rounded-2xl bg-white/70 px-4 py-5 shadow-sm backdrop-blur-[2px] sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:backdrop-blur-none"
      >
        <h1 class="text-2xl font-bold leading-snug text-gray-900 sm:text-4xl sm:leading-tight lg:text-5xl">
          เป็นเจ้าของ LG ง่ายกว่าใคร
        </h1>
        <p class="mt-2 text-base text-gray-700 sm:mt-4 sm:text-xl">
          เริ่มต้นเพียงหลักร้อย จ่ายง่ายผ่อนสบาย
        </p>

        <ul class="mt-4 space-y-2 sm:mt-8 sm:space-y-2.5">
          <li
            v-for="item in bullets"
            :key="item"
            class="flex items-start gap-2 text-xs text-gray-800 sm:gap-2.5 sm:text-base"
          >
            <Icon name="heroicons:check-circle" class="mt-0.5 h-4 w-4 shrink-0 text-[#ea1917] sm:h-5 sm:w-5" />
            <span>{{ item }}</span>
          </li>
        </ul>

        <NuxtLink
          to="/products"
          class="mt-5 inline-flex items-center gap-1 rounded-full bg-[#ea1917] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-red-700 sm:mt-10 sm:px-8 sm:py-3 sm:text-base"
        >
          เริ่มผ่อนกับเรา
          <Icon name="heroicons:chevron-right" class="h-4 w-4 sm:h-5 sm:w-5" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
