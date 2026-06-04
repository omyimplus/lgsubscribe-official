<script setup lang="ts">
import type { FaqItem } from '~~/shared/types/faqItem'

definePageMeta({ layout: 'default' })

const { set: setBreadcrumb } = usePageBreadcrumb()

const { data: items, pending, error } = await useFetch<FaqItem[]>('/api/public/faq-items', {
  key: 'public-faq-items',
  default: () => [],
})

useSeoMeta({
  title: 'FAQ — LG Subscribe',
  description: 'คำถามที่พบบ่อยเกี่ยวกับ LG Subscribe',
})

setBreadcrumb([
  { label: 'หน้าแรก', to: '/' },
  { label: 'FAQ' },
])
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <main class="index-container py-10 sm:py-12">
      <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
        FAQ — ถามตอบ
      </h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
        เลือกหัวข้อด้านล่างเพื่อดูคำตอบ
      </p>

      <div v-if="pending" class="mt-8 py-20 text-center text-gray-400">กำลังโหลด...</div>
      <div v-else-if="error" class="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        โหลด FAQ ไม่สำเร็จ
      </div>
      <div v-else class="mt-8">
        <FaqTabs :items="items ?? []" />
      </div>

      <p class="mt-10 text-center text-sm text-gray-500">
        <NuxtLink to="/articles" class="font-medium text-[#ea1917] hover:underline">
          ดูบทความอื่นๆ
        </NuxtLink>
      </p>
    </main>
  </div>
</template>
