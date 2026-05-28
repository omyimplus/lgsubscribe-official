<script setup lang="ts">
import { PRODUCT_FORM_KEY } from './form-context'

defineProps<{
  saveLabel?: string
  includeDescription?: boolean
}>()

const ctx = inject(PRODUCT_FORM_KEY)
if (!ctx) throw new Error('ProductFormActions must be used inside product form page')

const { saving, formError, uploadingImage, save } = ctx

async function onSave(includeDescription?: boolean) {
  await save({ includeDescription })
}
</script>

<template>
  <div class="sticky bottom-0 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
    <p v-if="formError" class="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
      {{ formError }}
    </p>
    <div class="flex items-center justify-end gap-3">
      <NuxtLink
        to="/admin/products"
        class="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
      >
        ยกเลิก
      </NuxtLink>
      <button
        type="button"
        class="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
        :disabled="saving || uploadingImage"
        @click="onSave(includeDescription)"
      >
        {{ saving ? 'กำลังบันทึก...' : (saveLabel ?? 'บันทึก') }}
      </button>
    </div>
  </div>
</template>
