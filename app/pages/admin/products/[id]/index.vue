<script setup lang="ts">
import { PRODUCT_FORM_KEY } from '~/components/admin/product/form-context'
import { useAdminProductForm } from '~/composables/useAdminProductForm'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const id = route.params.id as string

const formCtx = useAdminProductForm(id)
provide(PRODUCT_FORM_KEY, formCtx)
</script>

<template>
  <div class="pb-8">
    <div v-if="formCtx.loadingProduct.value" class="py-20 text-center text-gray-400">
      กำลังโหลด...
    </div>

    <template v-else-if="formCtx.product.value">
      <div class="mb-6 flex items-center justify-between gap-4">
        <NuxtLink to="/admin/products" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          กลับรายการสินค้า
        </NuxtLink>
        <div class="flex flex-wrap items-center gap-3">
          <NuxtLink
            :to="`/products/${id}`"
            target="_blank"
            class="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
          >
            <Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
            ดูหน้าสาธารณะ
          </NuxtLink>
          <NuxtLink
            :to="`/admin/products/${id}/plans`"
            class="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <Icon name="heroicons:document-text" class="h-4 w-4" />
            แผนสัญญา / ราคา
          </NuxtLink>
        </div>
      </div>

      <AdminPageHeader
        :title="formCtx.product.value.name"
        :description="`รหัสสินค้า: ${formCtx.product.value.sku}`"
      />

      <div class="mt-6 grid gap-8 lg:grid-cols-2">
        <AdminProductFormGallery />

        <div class="space-y-6">
          <form class="space-y-6" @submit.prevent="formCtx.save({ includeDescription: false })">
            <AdminProductFormBasic />
          </form>

          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 class="mb-2 text-lg font-semibold text-gray-900">รายละเอียดสินค้า</h2>
            <p class="mb-3 text-xs text-gray-500">
              ตัวอย่างเนื้อหา — แก้ไขแบบเต็มได้จากปุ่มด้านล่าง
            </p>
            <div
              class="prose prose-sm max-w-none text-gray-700"
              v-html="formCtx.form.description || '<p class=&quot;text-gray-400&quot;>ยังไม่มีข้อมูล</p>'"
            />
          </div>

          <AdminProductFormDetail />
        </div>
      </div>

      <AdminProductFormActions save-label="บันทึกข้อมูลสินค้า" />
    </template>

    <div v-else class="py-20 text-center text-gray-500">
      ไม่พบสินค้า
    </div>
  </div>
</template>
