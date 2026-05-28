<script setup lang="ts">
import { PRODUCT_FORM_KEY } from './form-context'

const ctx = inject(PRODUCT_FORM_KEY)
if (!ctx) throw new Error('ProductFormDetail must be used inside product form page')

const route = useRoute()
const productId = route.params.id as string
const { form } = ctx

type DetailField = 'description' | 'faq_html' | 'key_features' | 'features' | 'specifications'

const fields: Array<{ key: DetailField, title: string, subtitle: string }> = [
  { key: 'description', title: 'รายละเอียดสินค้า', subtitle: 'เนื้อหาภาพรวมของสินค้าในหน้ารายละเอียด' },
  { key: 'faq_html', title: 'FAQ', subtitle: 'คำถามที่พบบ่อย (แก้ไขแบบ HTML ทั้งก้อน)' },
  { key: 'key_features', title: 'คุณลักษณะที่สำคัญ', subtitle: 'จุดเด่นหลักของสินค้าแบบสรุป' },
  { key: 'features', title: 'คุณสมบัติ', subtitle: 'ข้อมูลเชิงใช้งาน/การทำงานของสินค้า' },
  { key: 'specifications', title: 'สเปคทางเทคนิค', subtitle: 'ข้อมูลเชิงเทคนิคแบบละเอียด' },
]
</script>

<template>
  <section class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
    <h3 class="mb-2 text-sm font-semibold text-gray-800">รายละเอียดภายใน</h3>
    <p class="mb-4 text-xs text-gray-500">
      เนื้อหาแต่ละส่วนแยกหน้าแก้ไขโดยเฉพาะ เพื่อรองรับข้อมูลจำนวนมาก
    </p>

    <div class="space-y-3">
      <div
        v-for="field in fields"
        :key="field.key"
        class="rounded-xl border border-gray-200 bg-gray-50/70 p-4"
      >
        <div class="mb-2 flex items-start justify-between gap-3">
          <div>
            <h4 class="text-sm font-semibold text-gray-900">{{ field.title }}</h4>
            <p class="text-xs text-gray-500">{{ field.subtitle }}</p>
          </div>
          <NuxtLink
            :to="`/admin/products/${productId}/detail/${field.key}`"
            class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            เพิ่ม/แก้ไข
          </NuxtLink>
        </div>
        <div
          class="line-clamp-3 text-sm text-gray-600"
          v-html="(form[field.key] as string) || '<span class=&quot;text-gray-400&quot;>ยังไม่มีข้อมูล</span>'"
        />
      </div>
    </div>
  </section>
</template>
