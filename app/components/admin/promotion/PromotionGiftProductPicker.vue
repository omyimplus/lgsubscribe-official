<script setup lang="ts">
import type { Product, ProductStatus } from '~~/shared/types/product'
import type { MainCategory } from '~~/shared/types/main-category'
import type { Category } from '~~/shared/types/category'
import { groupProducts } from '~~/shared/utils/productGroupDisplay'
import { categoriesGroupedByMain } from '~~/shared/utils/categoryDisplay'

const props = defineProps<{
  modelValue: string
  excludeProductId?: string
  catalogProducts: Product[]
  catalogPending?: boolean
  mainCategories: MainCategory[]
  categories: Category[]
}>()

const emit = defineEmits<{
  'update:modelValue': [productId: string]
}>()

const selectedId = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const filterCategoryId = ref('')
const pickerSearch = ref('')

const categoryPickerGroups = computed(() =>
  categoriesGroupedByMain(props.mainCategories ?? [], props.categories ?? [], { onlyActive: true }),
)

function productCountByCategory(categoryId: string) {
  return (props.catalogProducts ?? []).filter(p => p.category_id === categoryId).length
}

function productById(id: string) {
  return (props.catalogProducts ?? []).find(p => p.id === id)
}

const selectedProduct = computed(() =>
  selectedId.value ? productById(selectedId.value) : undefined,
)

watch(
  () => selectedId.value,
  (id) => {
    if (!id) return
    const product = productById(id)
    if (product?.category_id) filterCategoryId.value = product.category_id
  },
  { immediate: true },
)

watch(filterCategoryId, () => {
  pickerSearch.value = ''
})

const categoryProducts = computed(() => {
  if (!filterCategoryId.value) return []
  return (props.catalogProducts ?? []).filter((p) => {
    if (p.category_id !== filterCategoryId.value) return false
    if (props.excludeProductId && p.id === props.excludeProductId) return false
    return true
  })
})

const displayGroups = computed(() => groupProducts(categoryProducts.value))

const filteredGroups = computed(() => {
  const q = pickerSearch.value.trim().toLowerCase()
  if (!q) return displayGroups.value
  return displayGroups.value.filter(g =>
    g.displayName.toLowerCase().includes(q)
    || g.variants.some(v =>
      v.sku.toLowerCase().includes(q)
      || v.name.toLowerCase().includes(q),
    ),
  )
})

const listProducts = computed(() =>
  filteredGroups.value.flatMap(g => g.variants),
)

function giftStatusLabel(status: ProductStatus | undefined) {
  if (status === 'draft') return 'แบบร่าง'
  if (status === 'pending') return 'รอตรวจ'
  return null
}

function selectProduct(productId: string) {
  selectedId.value = productId
}

function clearSelection() {
  selectedId.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <label class="block text-xs font-medium text-gray-600">สินค้าของแถม (optional)</label>

    <div
      v-if="selectedProduct"
      class="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2"
    >
      <div class="min-w-0">
        <p class="truncate text-sm font-medium text-gray-900">{{ selectedProduct.name }}</p>
        <p class="font-mono text-xs text-gray-500">
          {{ selectedProduct.sku }}
          <span
            v-if="giftStatusLabel(selectedProduct.status)"
            class="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-800"
          >
            {{ giftStatusLabel(selectedProduct.status) }}
          </span>
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 text-xs text-red-500 hover:underline"
        @click="clearSelection"
      >
        ล้าง
      </button>
    </div>

    <select
      v-model="filterCategoryId"
      class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
    >
      <option value="">— เลือกหมวดหมู่ —</option>
      <optgroup v-for="g in categoryPickerGroups" :key="g.main.id" :label="g.main.name">
        <option
          v-for="c in g.categories"
          :key="c.id"
          :value="c.id"
          :disabled="!productCountByCategory(c.id)"
        >
          {{ c.name }}{{ productCountByCategory(c.id) ? ` (${productCountByCategory(c.id)})` : '' }}
        </option>
      </optgroup>
    </select>

    <input
      v-model="pickerSearch"
      type="search"
      placeholder="ค้นหา SKU / ชื่อในหมวดนี้..."
      class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:opacity-50"
      :disabled="!filterCategoryId"
    >

    <div class="max-h-44 overflow-y-auto rounded-xl border border-gray-200 bg-white">
      <div v-if="catalogPending" class="p-4 text-center text-xs text-gray-400">กำลังโหลด...</div>
      <div v-else-if="!filterCategoryId" class="p-4 text-center text-xs text-gray-500">เลือกหมวดหมู่ก่อน</div>
      <div v-else-if="!listProducts.length" class="p-4 text-center text-xs text-gray-500">ไม่พบสินค้าในหมวดนี้</div>
      <div v-else class="divide-y divide-gray-100">
        <button
          v-for="p in listProducts"
          :key="p.id"
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-50"
          :class="selectedId === p.id ? 'bg-red-50 hover:bg-red-50' : ''"
          @click="selectProduct(p.id)"
        >
          <span
            class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
            :class="selectedId === p.id ? 'border-red-500 bg-red-500' : 'border-gray-300'"
          >
            <span v-if="selectedId === p.id" class="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-medium text-gray-900">{{ p.name }}</span>
            <span class="font-mono text-xs text-gray-500">
              {{ p.sku }}
              <span
                v-if="giftStatusLabel(p.status)"
                class="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-800"
              >
                {{ giftStatusLabel(p.status) }}
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
