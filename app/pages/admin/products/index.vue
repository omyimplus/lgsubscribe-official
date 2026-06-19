<script setup lang="ts">
import type { Product, ProductStatus } from '~~/shared/types/product'
import type { MainCategory } from '~~/shared/types/main-category'
import type { Category } from '~~/shared/types/category'
import { groupProducts } from '~~/shared/utils/productGroupDisplay'
import { categoriesForMain, sortMainCategories } from '~~/shared/utils/categoryDisplay'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: products, pending, error: fetchError, refresh } = await useFetch<Product[]>('/api/products', {
  default: () => [],
})
const { data: mainCategories } = await useFetch<MainCategory[]>('/api/main-categories', { default: () => [] })
const { data: categories } = await useFetch<Category[]>('/api/categories', { default: () => [] })

const search = ref('')
const filterStatus = ref<ProductStatus | ''>('')
const filterCategory = ref('')
const clearingAll = ref(false)
const clearingCategory = ref(false)
const clearingSelected = ref(false)
const publishingAll = ref(false)
const selectedProductIds = ref(new Set<string>())

const statusOptions: { value: ProductStatus | '', label: string }[] = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'published', label: 'เผยแพร่' },
  { value: 'draft', label: 'แบบร่าง' },
  { value: 'pending', label: 'รออนุมัติ' },
]

const filtered = computed(() => {
  let list = products.value ?? []
  if (filterStatus.value) list = list.filter(p => p.status === filterStatus.value)
  if (filterCategory.value) list = list.filter(p => p.category_id === filterCategory.value)
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(p =>
    p.name.toLowerCase().includes(q)
    || p.sku.toLowerCase().includes(q)
    || p.category?.name.toLowerCase().includes(q)
    || p.product_group?.display_name?.toLowerCase().includes(q),
  )
})

const displayGroups = computed(() => groupProducts(filtered.value))

const filteredProductIds = computed(() => filtered.value.map(p => p.id))

const selectedCount = computed(() => selectedProductIds.value.size)

const allFilteredSelected = computed(() => {
  const ids = filteredProductIds.value
  if (!ids.length) return false
  return ids.every(id => selectedProductIds.value.has(id))
})

const someFilteredSelected = computed(() => {
  const ids = filteredProductIds.value
  if (!ids.length) return false
  const selected = ids.filter(id => selectedProductIds.value.has(id)).length
  return selected > 0 && selected < ids.length
})

function isProductSelected(id: string) {
  return selectedProductIds.value.has(id)
}

function isGroupSelected(variantIds: string[]) {
  return variantIds.length > 0 && variantIds.every(id => selectedProductIds.value.has(id))
}

function isGroupIndeterminate(variantIds: string[]) {
  const selected = variantIds.filter(id => selectedProductIds.value.has(id)).length
  return selected > 0 && selected < variantIds.length
}

function setSelectedIds(ids: string[], selected: boolean) {
  const next = new Set(selectedProductIds.value)
  for (const id of ids) {
    if (selected) next.add(id)
    else next.delete(id)
  }
  selectedProductIds.value = next
}

function toggleProduct(id: string) {
  setSelectedIds([id], !selectedProductIds.value.has(id))
}

function toggleGroup(variantIds: string[]) {
  setSelectedIds(variantIds, !isGroupSelected(variantIds))
}

function toggleAllFiltered() {
  setSelectedIds(filteredProductIds.value, !allFilteredSelected.value)
}

function clearSelection() {
  selectedProductIds.value = new Set()
}

function pruneSelection() {
  const valid = new Set((products.value ?? []).map(p => p.id))
  const next = new Set([...selectedProductIds.value].filter(id => valid.has(id)))
  if (next.size !== selectedProductIds.value.size) {
    selectedProductIds.value = next
  }
}

const stats = computed(() => {
  const list = products.value ?? []
  const groups = groupProducts(list)
  return {
    total: list.length,
    groups: groups.length,
    groupedSkus: groups.filter(g => g.variants.length > 1).reduce((n, g) => n + g.variants.length, 0),
    published: list.filter(p => p.status === 'published').length,
    pending: list.filter(p => p.status === 'pending').length,
    draft: list.filter(p => p.status === 'draft').length,
  }
})

function categoriesForMainGroup(mainId: string) {
  return categoriesForMain(categories.value ?? [], mainId)
}

const sortedMainCategories = computed(() => sortMainCategories(mainCategories.value ?? []))

const selectedCategoryName = computed(() =>
  categories.value?.find(c => c.id === filterCategory.value)?.name ?? '',
)

const productsInSelectedCategory = computed(() => {
  const catId = filterCategory.value
  if (!catId) return []
  return (products.value ?? []).filter(
    p => p.category_id === catId || p.category?.id === catId,
  )
})

const categoryDeleteCount = computed(() => productsInSelectedCategory.value.length)

const deleteCategoryButtonTitle = computed(() => {
  if (!filterCategory.value) return 'เลือกหมวดหมู่ก่อน'
  const name = selectedCategoryName.value || 'หมวดที่เลือก'
  return `ลบสินค้า ${categoryDeleteCount.value} รายการในหมวด "${name}"`
})

function statusLabel(s: ProductStatus) {
  if (s === 'published') return 'เผยแพร่'
  if (s === 'pending') return 'รออนุมัติ'
  return 'แบบร่าง'
}

function statusClass(s: ProductStatus) {
  if (s === 'published') return 'bg-emerald-50 text-emerald-700'
  if (s === 'pending') return 'bg-amber-50 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

async function handleDelete(p: Product) {
  if (!confirm(`ลบสินค้า "${p.name}" ใช่หรือไม่? รูป/วิดีโอใน Supabase ที่ผูกกับสินค้านี้จะถูกลบด้วย`)) return
  try {
    const res = await $fetch<{ storage?: { removedFiles: number } }>(`/api/products/${p.id}`, { method: 'DELETE' })
    const note = res.storage?.removedFiles ? ` (ลบไฟล์ใน Storage ${res.storage.removedFiles} ไฟล์)` : ''
    alert(`ลบสินค้าแล้ว${note}`)
    await refresh()
    pruneSelection()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}

async function handlePublishAll() {
  const total = products.value?.length ?? 0
  if (!total) {
    alert('ไม่มีสินค้า')
    return
  }
  const notPublished = total - stats.value.published
  const note = notPublished
    ? `จะเปลี่ยนสถานะ ${notPublished} รายการเป็น "เผยแพร่"`
    : 'สินค้าทั้งหมดเป็น "เผยแพร่" อยู่แล้ว'
  if (!confirm(`แสดงสินค้าทั้งหมด ${total} รายการบนเว็บไซต์ใช่หรือไม่?\n\n${note}\n\n(สถานะ = เผยแพร่, เปิดใช้งาน)`)) return

  publishingAll.value = true
  try {
    const res = await $fetch<{ updated: number }>('/api/products/publish-all', { method: 'PATCH' })
    alert(`ตั้งสถานะ "เผยแพร่" แล้ว ${res.updated} รายการ — แสดงบนเว็บไซต์ได้`)
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ตั้งสถานะไม่สำเร็จ')
  }
  finally {
    publishingAll.value = false
  }
}

async function handleDeleteByCategory() {
  if (!filterCategory.value) {
    alert('เลือกหมวดหมู่จากตัวกรองก่อน')
    return
  }
  const count = categoryDeleteCount.value
  if (!count) {
    alert(`ไม่มีสินค้าในหมวด "${selectedCategoryName.value}"`)
    return
  }
  if (!confirm(
    `ลบสินค้า ${count} รายการในหมวด "${selectedCategoryName.value}" ใช่หรือไม่?\n\n`
    + 'รูป/วิดีโอใน Storage ที่ผูกกับสินค้าเหล่านี้จะถูกลบด้วย\n'
    + '(ไม่กระทบสินค้าในหมวดอื่น)',
  )) return

  clearingCategory.value = true
  try {
    const res = await $fetch<{
      categoryName: string
      deleted: number
      storage: { removedFiles: number, errors: string[] }
    }>('/api/admin/products/by-category', {
      method: 'DELETE',
      body: { categoryId: filterCategory.value },
    })
    const storageNote = res.storage.removedFiles
      ? ` (ลบไฟล์ Storage ${res.storage.removedFiles} ไฟล์)`
      : ''
    alert(`ลบสินค้าในหมวด "${res.categoryName}" แล้ว ${res.deleted} รายการ${storageNote}`)
    await refresh()
    pruneSelection()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบสินค้าในหมวดไม่สำเร็จ')
  }
  finally {
    clearingCategory.value = false
  }
}

async function handleDeleteSelected() {
  const ids = [...selectedProductIds.value]
  if (!ids.length) {
    alert('ยังไม่ได้เลือกสินค้า')
    return
  }

  const preview = (products.value ?? [])
    .filter(p => selectedProductIds.value.has(p.id))
    .slice(0, 8)
    .map(p => `• ${p.sku} — ${p.name}`)
  const hiddenCount = ids.length - preview.length
  const listNote = preview.length
    ? `\n\n${preview.join('\n')}${hiddenCount > 0 ? `\n… และอีก ${hiddenCount} รายการ` : ''}`
    : ''

  if (!confirm(
    `ลบสินค้าที่เลือก ${ids.length} รายการใช่หรือไม่?${listNote}\n\n`
    + 'รูป/วิดีโอใน Storage ที่ผูกกับสินค้าเหล่านี้จะถูกลบด้วย',
  )) return

  clearingSelected.value = true
  try {
    const res = await $fetch<{
      deleted: number
      storage: { removedFiles: number, errors: string[] }
    }>('/api/admin/products/bulk', {
      method: 'DELETE',
      body: { productIds: ids },
    })
    const storageNote = res.storage.removedFiles
      ? ` (ลบไฟล์ Storage ${res.storage.removedFiles} ไฟล์)`
      : ''
    alert(`ลบสินค้าแล้ว ${res.deleted} รายการ${storageNote}`)
    clearSelection()
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบสินค้าที่เลือกไม่สำเร็จ')
  }
  finally {
    clearingSelected.value = false
  }
}

async function handleDeleteAll() {
  const total = products.value?.length ?? 0
  if (!total) {
    alert('ไม่มีสินค้าให้ลบ')
    return
  }
  if (!confirm(`ลบสินค้าทั้งหมด ${total} รายการใช่หรือไม่?\n\nรูป/วิดีโอใน Supabase ที่อ้างอิงจากสินค้าเหล่านี้จะถูกลบด้วย (รวม lg-import และ editor)`)) return
  clearingAll.value = true
  try {
    const res = await $fetch<{
      deleted: number
      storage: { removedFiles: number, errors: string[] }
    }>('/api/products', { method: 'DELETE' })
    const storageNote = res.storage.removedFiles
      ? ` ลบไฟล์ใน Storage ${res.storage.removedFiles} ไฟล์`
      : ''
    alert(`ลบสินค้าแล้ว ${res.deleted} รายการ${storageNote}`)
    if (res.storage.errors.length) {
      console.warn('product storage cleanup:', res.storage.errors)
    }
    await refresh()
    clearSelection()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบทั้งหมดไม่สำเร็จ')
  }
  finally {
    clearingAll.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="สินค้า"
      description="รายการสินค้าทั้งหมด — กดเพิ่มเพื่อไปหน้าสร้างแยก"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
          :disabled="publishingAll || clearingAll || clearingCategory || clearingSelected || !stats.total"
          @click="handlePublishAll"
        >
          <Icon name="heroicons:globe-alt" class="h-4 w-4" />
          {{ publishingAll ? 'กำลังเผยแพร่...' : 'แสดงขึ้น website' }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          :disabled="clearingAll || clearingCategory || clearingSelected || publishingAll || !stats.total"
          @click="handleDeleteAll"
        >
          <Icon name="heroicons:trash" class="h-4 w-4" />
          {{ clearingAll ? 'กำลังลบ...' : 'ลบสินค้าทั้งหมด' }}
        </button>
        <NuxtLink
          to="/admin/product-groups"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Icon name="heroicons:squares-2x2" class="h-4 w-4" />
          จัดกลุ่ม PLP
        </NuxtLink>
        <NuxtLink
          to="/admin/products/new"
          class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          เพิ่มสินค้า
        </NuxtLink>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">รหัสสินค้า ทั้งหมด</p>
        <p class="mt-1 text-2xl font-bold">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">กลุ่ม (การ์ด)</p>
        <p class="mt-1 text-2xl font-bold text-sky-600">{{ stats.groups }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">เผยแพร่</p>
        <p class="mt-1 text-2xl font-bold text-emerald-600">{{ stats.published }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">รออนุมัติ</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ stats.pending }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">แบบร่าง</p>
        <p class="mt-1 text-2xl font-bold text-gray-500">{{ stats.draft }}</p>
      </div>
    </div>

    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div class="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            v-model="search"
            type="search"
            placeholder="ค้นหาชื่อ / รหัสสินค้า..."
            class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
          >
        </div>
        <select v-model="filterStatus" class="rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          <option v-for="o in statusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <select v-model="filterCategory" class="min-w-[160px] rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          <option value="">ทุกหมวดหมู่</option>
          <optgroup v-for="main in sortedMainCategories" :key="main.id" :label="main.name">
            <option v-for="c in categoriesForMainGroup(main.id)" :key="c.id" :value="c.id">{{ c.name }}</option>
          </optgroup>
        </select>
        <button
          v-if="selectedCount > 0"
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-200 disabled:opacity-50"
          :disabled="clearingSelected || clearingCategory || clearingAll || publishingAll"
          @click="handleDeleteSelected"
        >
          <Icon name="heroicons:trash" class="h-4 w-4 shrink-0" />
          {{ clearingSelected ? 'กำลังลบ...' : `ลบที่เลือก (${selectedCount})` }}
        </button>
        <button
          v-if="selectedCount > 0"
          type="button"
          class="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          :disabled="clearingSelected || clearingCategory || clearingAll || publishingAll"
          @click="clearSelection"
        >
          ล้างการเลือก
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          :disabled="!filterCategory || categoryDeleteCount < 1 || clearingCategory || clearingAll || clearingSelected || publishingAll"
          :title="deleteCategoryButtonTitle"
          @click="handleDeleteByCategory"
        >
          <Icon name="heroicons:trash" class="h-4 w-4 shrink-0" />
          <span v-if="clearingCategory">กำลังลบ...</span>
          <span v-else-if="filterCategory">ลบในหมวด ({{ categoryDeleteCount }})</span>
          <span v-else>ลบในหมวด</span>
        </button>
      </div>

      <div v-if="fetchError" class="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ fetchError.message }}
      </div>

      <div class="overflow-x-auto">
        <div
          v-if="!pending && displayGroups.length"
          class="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-2 text-xs text-gray-500"
        >
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              :checked="allFilteredSelected"
              :indeterminate.prop="someFilteredSelected"
              @change="toggleAllFiltered"
            >
            <span>เลือกทั้งหมดที่แสดง ({{ filtered.length }})</span>
          </label>
          <span class="text-gray-300">|</span>
          <span>
            {{ displayGroups.length }} กลุ่ม · {{ filtered.length }} รหัสสินค้า
            <span class="text-gray-400">· กลุ่ม = การ์ดเดียวบน LG (หลายขนาด)</span>
          </span>
          <span v-if="selectedCount > 0" class="font-medium text-red-600">
            · เลือกแล้ว {{ selectedCount }} รายการ
          </span>
        </div>

        <div v-if="pending" class="py-16 text-center text-gray-400">
          กำลังโหลด...
        </div>

        <div v-else-if="!displayGroups.length" class="py-16 text-center">
          <p class="text-gray-500">ยังไม่มีสินค้า</p>
          <NuxtLink to="/admin/products/new" class="mt-3 inline-block text-sm font-semibold text-red-500 hover:underline">
            + เพิ่มสินค้าแรก
          </NuxtLink>
        </div>

        <div
          v-for="group in displayGroups"
          v-else
          :key="group.groupId ?? group.variants[0]!.id"
          class="border-b border-gray-100 last:border-b-0"
        >
          <div class="flex items-center gap-3 bg-slate-50/90 px-4 py-2.5">
            <label
              v-if="group.variants.length > 1"
              class="inline-flex shrink-0 cursor-pointer items-center"
              :title="`เลือกทุกขนาดในกลุ่ม (${group.variants.length})`"
            >
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                :checked="isGroupSelected(group.variants.map(v => v.id))"
                :indeterminate.prop="isGroupIndeterminate(group.variants.map(v => v.id))"
                @change="toggleGroup(group.variants.map(v => v.id))"
              >
            </label>
            <div v-else class="w-4 shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-gray-900">
                {{ group.displayName }}
              </p>
              <p class="truncate font-mono text-[10px] text-gray-400">
                {{ group.groupKey ?? 'ไม่มีกลุ่ม — รหัสสินค้าเดียว' }}
              </p>
            </div>
            <span class="shrink-0 text-xs text-gray-500">
              {{ group.variants.length > 1 ? `${group.variants.length} ขนาด` : 'รหัสสินค้าเดียว' }}
            </span>
          </div>

          <table class="w-full min-w-[800px] text-sm">
            <tbody class="divide-y divide-gray-50">
              <tr v-for="p in group.variants" :key="p.id" class="hover:bg-gray-50/80">
                <td class="w-10 px-2 py-3">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    :checked="isProductSelected(p.id)"
                    @change="toggleProduct(p.id)"
                  >
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                      <img v-if="p.image_url" :src="p.image_url" :alt="p.name" class="h-full w-full object-cover">
                      <div v-else class="flex h-full items-center justify-center">
                        <Icon name="heroicons:photo" class="h-5 w-5 text-gray-300" />
                      </div>
                    </div>
                    <div class="min-w-0">
                      <p class="font-medium text-gray-900">{{ p.name }}</p>
                      <p v-if="p.variant_label" class="text-xs text-gray-500">{{ p.variant_label }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 font-mono text-xs">{{ p.sku }}</td>
                <td class="px-4 py-3 text-gray-600">{{ p.category?.name }}</td>
                <td class="px-4 py-3 font-medium">{{ formatBaht(p.discounted_price ?? p.base_price) }}</td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(p.status)">
                    {{ statusLabel(p.status) }}
                  </span>
                </td>
                <td class="w-24 px-4 py-3 text-right">
                  <NuxtLink
                    :to="`/admin/products/${p.id}`"
                    class="inline-flex rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <Icon name="heroicons:pencil-square" class="h-4 w-4" />
                  </NuxtLink>
                  <button type="button" class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" @click="handleDelete(p)">
                    <Icon name="heroicons:trash" class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>
