<script setup lang="ts">
import { IMPORT_ITEM_FORM_KEY } from './form-context'
import type { ImportItemDetailField } from '~/composables/useAdminImportItemForm'

const ctx = inject(IMPORT_ITEM_FORM_KEY)
if (!ctx) throw new Error('AdminImportFormDetail must be used inside import item page')

const route = useRoute()
const itemId = route.params.itemId as string
const { form } = ctx

const fields: Array<{ key: ImportItemDetailField, title: string, subtitle: string }> = [
  { key: 'key_features', title: 'คุณลักษณะที่สำคัญ', subtitle: 'จุดเด่นหลักของสินค้าแบบสรุป' },
  { key: 'features', title: 'คุณสมบัติ', subtitle: 'ข้อมูลเชิงใช้งาน/การทำงานของสินค้า' },
  { key: 'specifications', title: 'สเปคทางเทคนิค', subtitle: 'ข้อมูลเชิงเทคนิคแบบละเอียด' },
  { key: 'faq_html', title: 'FAQ', subtitle: 'คำถามที่พบบ่อย (แก้ไขแบบ HTML ทั้งก้อน)' },
]
</script>

<template>
  <section class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
    <h2 class="mb-2 text-lg font-semibold text-gray-900">รายละเอียดภายใน</h2>
    <p class="mb-4 text-xs text-gray-500">
      แยกหน้าแก้ไขต่อส่วน — ตรวจและปรับเนื้อหาก่อน promote
    </p>

    <div class="space-y-3">
      <div
        v-for="field in fields"
        :key="field.key"
        class="rounded-xl border border-gray-200 bg-gray-50/70 p-4"
      >
        <div class="mb-2 flex items-start justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">{{ field.title }}</h3>
            <p class="text-xs text-gray-500">{{ field.subtitle }}</p>
          </div>
          <NuxtLink
            :to="`/admin/import-items/${itemId}/detail/${field.key}`"
            class="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            ตรวจ/แก้ไข
          </NuxtLink>
        </div>
        <div
          class="line-clamp-3 text-sm text-gray-600"
          v-html="form[field.key] || '<span class=&quot;text-gray-400&quot;>ยังไม่มีข้อมูล</span>'"
        />
      </div>
    </div>
  </section>
</template>
