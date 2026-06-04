<script setup lang="ts">
import type { PublicCategoryGroup } from '~~/server/api/public/categories.get'
import {
  PRODUCT_SORT_OPTIONS,
  type ProductSortKey,
} from '~~/shared/utils/productListing'

defineProps<{
  /** ใช้ใน drawer — ไม่ใส่ sticky / ไม่ใช้แท็ก aside ซ้อน */
  embedded?: boolean
  groups: PublicCategoryGroup[]
  categorySlug: string
  sortKey: ProductSortKey
  resultCount: number
  skuCount: number
  pageRangeLabel?: string
}>()

const emit = defineEmits<{
  'update:category': [slug: string]
  'update:sort': [key: ProductSortKey]
  clear: []
}>()
</script>

<template>
  <component
    :is="embedded ? 'div' : 'aside'"
    class="space-y-6"
    :class="{ 'lg:sticky lg:top-24 lg:self-start': !embedded }"
  >
    <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-gray-900">
          หมวดสินค้า
        </h2>
        <button
          v-if="categorySlug"
          type="button"
          class="text-xs font-medium text-[#ea1917] hover:underline"
          @click="emit('clear')"
        >
          ล้าง
        </button>
      </div>

      <nav class="mt-3 space-y-1" aria-label="กรองหมวดสินค้า">
        <button
          type="button"
          class="flex w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition"
          :class="!categorySlug
            ? 'bg-red-50 text-[#ea1917]'
            : 'text-gray-700 hover:bg-gray-50'"
          @click="emit('update:category', '')"
        >
          ทุกหมวด
        </button>

        <div
          v-for="group in groups"
          :key="group.main.id"
          class="pt-2"
        >
          <p class="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {{ group.main.name }}
          </p>
          <button
            v-for="cat in group.categories"
            :key="cat.id"
            type="button"
            class="flex w-full rounded-xl px-3 py-2 text-left text-sm transition"
            :class="categorySlug === cat.slug
              ? 'bg-red-50 font-medium text-[#ea1917]'
              : 'text-gray-700 hover:bg-gray-50'"
            @click="emit('update:category', cat.slug)"
          >
            {{ cat.name }}
          </button>
        </div>
      </nav>
    </section>

    <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 class="text-sm font-semibold text-gray-900">
        เรียงลำดับ
      </h2>
      <fieldset class="mt-3 space-y-1">
        <legend class="sr-only">
          เรียงลำดับสินค้า
        </legend>
        <label
          v-for="opt in PRODUCT_SORT_OPTIONS"
          :key="opt.value"
          class="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 transition hover:bg-gray-50"
        >
          <input
            type="radio"
            name="product-sort"
            class="size-4 border-gray-300 text-[#ea1917] focus:ring-[#ea1917]"
            :value="opt.value"
            :checked="sortKey === opt.value"
            @change="emit('update:sort', opt.value)"
          >
          <span class="text-sm text-gray-800">{{ opt.label }}</span>
        </label>
      </fieldset>
    </section>

    <p class="px-1 text-xs text-gray-500">
      {{ resultCount }} กลุ่ม · {{ skuCount }} รหัสสินค้า
      <span v-if="pageRangeLabel" class="mt-1 block text-gray-400">
        แสดง {{ pageRangeLabel }}
      </span>
    </p>
  </component>
</template>
