<script setup lang="ts">
import ProductListingSidebar from '~/components/products/ProductListingSidebar.vue'
import type { PublicCategoryGroup } from '~~/server/api/public/categories.get'
import type { ProductSortKey } from '~~/shared/utils/productListing'

const props = defineProps<{
  id?: string
  open: boolean
  groups: PublicCategoryGroup[]
  categorySlug: string
  sortKey: ProductSortKey
  resultCount: number
  skuCount: number
  pageRangeLabel?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:category': [slug: string]
  'update:sort': [key: ProductSortKey]
  clear: []
}>()

function close() {
  emit('update:open', false)
}

function onCategory(slug: string) {
  emit('update:category', slug)
  close()
}

function onSort(key: ProductSortKey) {
  emit('update:sort', key)
}

function onClear() {
  emit('clear')
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close()
}

watch(() => props.open, (isOpen) => {
  if (!import.meta.client) return
  document.body.style.overflow = isOpen ? 'hidden' : ''
  if (isOpen) {
    window.addEventListener('keydown', onKeydown)
  }
  else {
    window.removeEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-show="open"
      class="fixed inset-0 z-[110] lg:hidden"
      :aria-hidden="!open"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/40"
        aria-label="ปิดตัวกรอง"
        tabindex="-1"
        @click="close"
      />

      <aside
        :id="id"
        class="fixed inset-y-0 left-0 z-[111] grid h-dvh w-full max-w-[20rem] grid-rows-[auto_minmax(0,1fr)] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="กรองและเรียงสินค้า"
        @click.stop
      >
        <header class="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))]">
          <h2 class="text-base font-bold text-gray-900">
            กรองและเรียง
          </h2>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="ปิด"
            @click="close"
          >
            <Icon name="heroicons:x-mark" class="h-5 w-5" />
          </button>
        </header>

        <div class="overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <ProductListingSidebar
            embedded
            :groups="groups"
            :category-slug="categorySlug"
            :sort-key="sortKey"
            :result-count="resultCount"
            :sku-count="skuCount"
            :page-range-label="pageRangeLabel"
            @update:category="onCategory"
            @update:sort="onSort"
            @clear="onClear"
          />
        </div>
      </aside>
    </div>
  </Teleport>
</template>
