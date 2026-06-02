<script setup lang="ts">
import { useAdminImportItemForm, type ImportItemDetailField } from '~/composables/useAdminImportItemForm'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const router = useRouter()
const itemId = route.params.itemId as string
const fieldParam = route.params.field as string

const labels: Record<ImportItemDetailField, string> = {
  key_features: 'คุณลักษณะที่สำคัญ',
  features: 'คุณสมบัติ',
  specifications: 'สเปคทางเทคนิค',
  faq_html: 'FAQ',
}

function isDetailField(value: string): value is ImportItemDetailField {
  return ['key_features', 'features', 'specifications', 'faq_html'].includes(value)
}

if (!isDetailField(fieldParam)) {
  throw createError({ statusCode: 404, statusMessage: 'ไม่พบฟิลด์ที่ต้องการแก้ไข' })
}

const field = computed(() => fieldParam as ImportItemDetailField)
const formCtx = useAdminImportItemForm(itemId)

const isLoading = computed(() => formCtx.loadingItem.value)
const importItem = computed(() => formCtx.item.value)
const loadError = computed(() => formCtx.fetchError.value)
const saving = computed(() => formCtx.saving.value)
const formError = computed(() => formCtx.formError.value)

const content = ref('')
const editorReady = ref(false)

watch(
  () => [isLoading.value, formCtx.form[field.value]] as const,
  ([loading, html]) => {
    if (loading) {
      editorReady.value = false
      return
    }
    content.value = html || ''
    editorReady.value = true
  },
  { immediate: true },
)

async function saveContent() {
  formCtx.form[field.value] = content.value
  const ok = await formCtx.saveSingleDetailField(field.value)
  if (ok) {
    await router.push(`/admin/import-items/${itemId}`)
  }
}
</script>

<template>
  <div class="pb-24">
    <div v-if="isLoading" class="py-20 text-center text-gray-400">
      กำลังโหลด...
    </div>

    <div v-else-if="loadError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ loadError.message || 'โหลดรายการไม่สำเร็จ' }}
    </div>

    <template v-else-if="importItem">
      <div class="mb-6">
        <NuxtLink
          :to="`/admin/import-items/${itemId}`"
          class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
        >
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          กลับหน้า Draft Item
        </NuxtLink>
      </div>

      <AdminPageHeader
        :title="`ตรวจ/แก้ไข ${labels[field]}`"
        :description="`${importItem.name} • SKU: ${importItem.sku}`"
      />

      <section class="mt-6 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <AdminImportHtmlFieldEditor
          v-if="editorReady"
          :key="`${itemId}-${field}`"
          v-model="content"
          :placeholder="`แก้ไข HTML ${labels[field]}...`"
        />

        <p v-else class="py-12 text-center text-sm text-gray-400">
          กำลังเตรียม editor...
        </p>

        <p v-if="formError" class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ formError }}
        </p>
      </section>

      <div class="sticky bottom-0 -mx-4 mt-6 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div class="flex items-center justify-end gap-3">
          <NuxtLink
            :to="`/admin/import-items/${itemId}`"
            class="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            ยกเลิก
          </NuxtLink>
          <button
            type="button"
            class="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            :disabled="saving || !editorReady"
            @click="saveContent"
          >
            {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
        </div>
      </div>
    </template>

    <div v-else class="py-20 text-center text-gray-500">
      ไม่พบรายการ import
    </div>
  </div>
</template>
