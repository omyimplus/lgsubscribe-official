<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center p-8">
    <div class="text-center">
      <h1 class="text-5xl font-bold text-gray-900">LG Subscribe</h1>
      <p class="mt-4 text-lg text-gray-500">สมัครใช้เครื่องใช้ไฟฟ้า LG แบบรายเดือน</p>
      <div class="mt-8 flex flex-wrap justify-center gap-4">
        <NuxtLink
          to="/products"
          class="rounded-full bg-[#ea1917] px-8 py-3 text-sm font-semibold text-white shadow hover:bg-red-700 transition-colors"
        >
          ดูสินค้าทั้งหมด
        </NuxtLink>
        <NuxtLink
          to="/auth/register"
          class="rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
        >
          สมัครสมาชิก
        </NuxtLink>
        <NuxtLink
          to="/auth/login"
          class="rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
        >
          เข้าสู่ระบบ
        </NuxtLink>
      </div>
    </div>
  </main>
</template>
