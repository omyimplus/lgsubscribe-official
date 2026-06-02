<script setup lang="ts">
import { PRODUCT_FORM_KEY } from '~/components/admin/product/form-context'
import { useAdminProductForm } from '~/composables/useAdminProductForm'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const formCtx = useAdminProductForm()
provide(PRODUCT_FORM_KEY, formCtx)
</script>

<template>
  <div class="pb-24">
    <div class="mb-6">
      <NuxtLink to="/admin/products" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
        <Icon name="heroicons:arrow-left" class="h-4 w-4" />
        กลับรายการสินค้า
      </NuxtLink>
    </div>

    <AdminPageHeader
      title="เพิ่มสินค้า"
      description="ขั้นตอนที่ 1 — ข้อมูลการ์ดสินค้า ราคา และบริการ (ยังไม่รวมรายละเอียดภายใน)"
    />

    <div class="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      หลังบันทึก ระบบจะพาไปหน้าแก้ไขเพื่อเพิ่ม <strong>รายละเอียดภายใน</strong> ในขั้นตอนถัดไป
    </div>

    <form class="space-y-8" @submit.prevent="formCtx.save({ includeDescription: false })">
      <AdminProductFormGallery />
      <AdminProductFormBasic />
      <AdminProductFormActions save-label="สร้างสินค้า" />
    </form>
  </div>
</template>
