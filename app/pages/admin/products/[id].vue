<script setup lang="ts">
import { PRODUCT_FORM_KEY } from '~/components/admin/product/form-context'
import { useAdminProductForm } from '~/composables/useAdminProductForm'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const id = route.params.id as string

const formCtx = useAdminProductForm(id)
provide(PRODUCT_FORM_KEY, formCtx)

const activeTab = ref<'basic' | 'detail'>('basic')
</script>

<template>
  <div class="pb-24">
    <div v-if="formCtx.loadingProduct.value" class="py-20 text-center text-gray-400">
      กำลังโหลด...
    </div>

    <template v-else-if="formCtx.product.value">
      <div class="mb-6">
        <NuxtLink to="/admin/products" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          กลับรายการสินค้า
        </NuxtLink>
      </div>

      <AdminPageHeader
        :title="formCtx.product.value.name"
        :description="`SKU: ${formCtx.product.value.sku}`"
      />

      <div class="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="activeTab === 'basic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'basic'"
        >
          ข้อมูลสินค้า
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="activeTab === 'detail' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'detail'"
        >
          รายละเอียดภายใน
        </button>
      </div>

      <form @submit.prevent="formCtx.save({ includeDescription: false })">
        <AdminProductFormBasic v-show="activeTab === 'basic'" />
        <AdminProductFormDetail v-show="activeTab === 'detail'" />
        <AdminProductFormActions v-show="activeTab === 'basic'" save-label="บันทึกข้อมูลสินค้า" />
      </form>
    </template>

    <div v-else class="py-20 text-center text-gray-500">
      ไม่พบสินค้า
    </div>
  </div>
</template>
