<script setup lang="ts">
import { PRODUCT_FORM_KEY } from './form-context'

const ctx = inject(PRODUCT_FORM_KEY)
if (!ctx) throw new Error('ProductFormDetail must be used inside product form page')

const route = useRoute()
const productId = computed(() => route.params.id as string)
const { form } = ctx

type DetailField = 'description' | 'faq_html' | 'key_features' | 'features' | 'specifications'

const fields: Array<{ key: DetailField, title: string, subtitle: string }> = [
  { key: 'description', title: 'รายละเอียดสินค้า', subtitle: 'เนื้อหาภาพรวมของสินค้าในหน้ารายละเอียด' },
  { key: 'key_features', title: 'คุณลักษณะที่สำคัญ', subtitle: 'จุดเด่นหลักของสินค้าแบบสรุป' },
  { key: 'features', title: 'คุณสมบัติ', subtitle: 'ข้อมูลเชิงใช้งาน/การทำงานของสินค้า' },
  { key: 'specifications', title: 'สเปคทางเทคนิค', subtitle: 'ข้อมูลเชิงเทคนิคแบบละเอียด' },
  { key: 'faq_html', title: 'FAQ', subtitle: 'คำถามที่พบบ่อย (แก้ไขแบบ HTML ทั้งก้อน)' },
]

function detailPath(field: DetailField) {
  return `/admin/products/${productId.value}/detail/${field}`
}

function hasContent(field: DetailField) {
  return Boolean(String(form[field] ?? '').trim())
}
</script>

<template>
  <section class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
    <h2 class="mb-2 text-lg font-semibold text-gray-900">รายละเอียดภายใน</h2>
    <p class="mb-4 text-xs text-gray-500">
      แยกหน้าแก้ไขต่อส่วน — ใช้ HTML editor เหมือนหน้า Import
    </p>

    <div class="space-y-3">
      <NuxtLink
        v-for="field in fields"
        :key="field.key"
        :to="detailPath(field.key)"
        class="group block rounded-xl border border-gray-200 bg-gray-50/70 p-4 transition hover:border-red-200 hover:bg-white hover:shadow-sm"
      >
        <div class="mb-2 flex items-start justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 group-hover:text-red-700">
              {{ field.title }}
            </h3>
            <p class="text-xs text-gray-500">{{ field.subtitle }}</p>
          </div>
          <span
            class="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 group-hover:border-red-200 group-hover:text-red-700"
          >
            {{ hasContent(field.key) ? 'ตรวจ/แก้ไข' : 'เพิ่มเนื้อหา' }}
          </span>
        </div>
        <div
          class="pointer-events-none line-clamp-3 text-sm text-gray-600"
          v-html="(form[field.key] as string) || '<span class=&quot;text-gray-400&quot;>ยังไม่มีข้อมูล</span>'"
        />
      </NuxtLink>
    </div>
  </section>
</template>
