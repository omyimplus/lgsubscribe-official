<script setup lang="ts">
import { useAdminProductForm } from '~/composables/useAdminProductForm'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type DetailField = 'description' | 'faq_html' | 'key_features' | 'features' | 'specifications'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const fieldParam = route.params.field as string

const labels: Record<DetailField, string> = {
  description: 'รายละเอียดสินค้า',
  faq_html: 'FAQ',
  key_features: 'คุณลักษณะที่สำคัญ',
  features: 'คุณสมบัติ',
  specifications: 'สเปคทางเทคนิค',
}

function isDetailField(value: string): value is DetailField {
  return ['description', 'faq_html', 'key_features', 'features', 'specifications'].includes(value)
}

if (!isDetailField(fieldParam)) {
  throw createError({ statusCode: 404, statusMessage: 'ไม่พบฟิลด์ที่ต้องการแก้ไข' })
}

const field = computed(() => fieldParam as DetailField)
const formCtx = useAdminProductForm(id)
const content = ref('')
const isFaqField = computed(() => field.value === 'faq_html')

watch(() => formCtx.form[field.value] as string, (value) => {
  content.value = value || ''
}, { immediate: true })

async function saveContent() {
  formCtx.form[field.value] = content.value
  const ok = await formCtx.saveSingleDetailField(field.value)
  if (ok) {
    await router.push(`/admin/products/${id}`)
  }
}
</script>

<template>
  <div class="pb-24">
    <div v-if="formCtx.loadingProduct.value" class="py-20 text-center text-gray-400">
      กำลังโหลด...
    </div>

    <template v-else-if="formCtx.product.value">
      <div class="mb-6">
        <NuxtLink :to="`/admin/products/${id}`" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          กลับหน้าแก้ไขสินค้า
        </NuxtLink>
      </div>

      <AdminPageHeader
        :title="`แก้ไข ${labels[field]}`"
        :description="`${formCtx.product.value.name} • SKU: ${formCtx.product.value.sku}`"
      />

      <section class="mt-6 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <AdminProductRichFieldEditor
          v-model="content"
          :placeholder="`กรอก ${labels[field]}...`"
        />

        <div v-if="isFaqField" class="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Preview FAQ</p>
          <div class="prose prose-sm max-w-none text-gray-700" v-html="content || '<p>-</p>'" />
        </div>

        <p v-if="formCtx.formError.value" class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ formCtx.formError.value }}
        </p>
      </section>

      <div class="sticky bottom-0 -mx-4 mt-6 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div class="flex items-center justify-end gap-3">
          <NuxtLink
            :to="`/admin/products/${id}`"
            class="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            ยกเลิก
          </NuxtLink>
          <button
            type="button"
            class="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            :disabled="formCtx.saving.value"
            @click="saveContent"
          >
            {{ formCtx.saving.value ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
        </div>
      </div>
    </template>

    <div v-else class="py-20 text-center text-gray-500">
      ไม่พบสินค้า
    </div>
  </div>
</template>
