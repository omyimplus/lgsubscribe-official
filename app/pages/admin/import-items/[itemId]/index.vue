<script setup lang="ts">
import { IMPORT_ITEM_FORM_KEY } from '~/components/admin/import/form-context'
import { useAdminImportItemForm } from '~/composables/useAdminImportItemForm'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const itemId = route.params.itemId as string

const formCtx = useAdminImportItemForm(itemId)
provide(IMPORT_ITEM_FORM_KEY, formCtx)

const item = computed(() => formCtx.item.value)
const pending = computed(() => formCtx.loadingItem.value)
const loadError = computed(() => formCtx.fetchError.value)
const selectedImage = ref('')

watch(item, (value) => {
  if (!value) return
  selectedImage.value = value.image_urls?.[0] || value.image_url || ''
}, { immediate: true })
</script>

<template>
  <div class="pb-12">
    <div v-if="pending" class="py-20 text-center text-gray-400">กำลังโหลด...</div>

    <div v-else-if="loadError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ loadError.message || 'โหลดรายการไม่สำเร็จ' }}
    </div>

    <template v-else-if="item">
      <div class="mb-6 flex items-center justify-between">
        <NuxtLink to="/admin/import" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          กลับหน้า Import
        </NuxtLink>
        <a
          v-if="item.source_url"
          :href="item.source_url"
          target="_blank"
          class="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
        >
          <Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
          เปิดต้นทาง LG
        </a>
      </div>

      <AdminPageHeader :title="item.name" :description="`Draft Item • SKU: ${item.sku}`" />

      <div class="mt-6 grid gap-8 lg:grid-cols-2">
        <section>
          <div class="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4">
            <img :src="selectedImage || item.image_url || ''" class="h-[360px] w-full object-contain" :alt="item.name">
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(url, idx) in (item.image_urls?.length ? item.image_urls : (item.image_url ? [item.image_url] : []))"
              :key="`${url}-${idx}`"
              type="button"
              class="overflow-hidden rounded-lg border p-1"
              :class="selectedImage === url ? 'border-red-500' : 'border-gray-200'"
              @click="selectedImage = url"
            >
              <img :src="url" class="h-16 w-16 object-contain" :alt="`${item.name}-${idx + 1}`">
            </button>
          </div>
        </section>

        <section class="space-y-6">
          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 class="mb-2 text-lg font-semibold text-gray-900">ข้อมูลราคา</h2>
            <ul class="space-y-1 text-sm text-gray-700">
              <li>ราคาเริ่มต้น: {{ formatBaht(item.base_price ?? 0) }}</li>
              <li>ราคาเต็ม: {{ item.full_price != null ? formatBaht(item.full_price) : '-' }}</li>
              <li>ช่วงราคา: {{ item.price_range || '-' }}</li>
            </ul>
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 class="mb-2 text-lg font-semibold text-gray-900">รายละเอียดสินค้า</h2>
            <div class="prose prose-sm max-w-none text-gray-700" v-html="item.description || '<p>-</p>'" />
          </div>

          <AdminImportFormDetail />
        </section>
      </div>
    </template>

    <div v-else class="py-20 text-center text-gray-500">
      ไม่พบรายการ import
    </div>
  </div>
</template>
