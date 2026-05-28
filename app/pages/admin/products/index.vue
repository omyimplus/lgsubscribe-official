<script setup lang="ts">
import type { Product, ProductStatus } from '~~/shared/types/product'
import type { MainCategory } from '~~/shared/types/main-category'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: products, pending, error: fetchError, refresh } = await useFetch<Product[]>('/api/products', {
  default: () => [],
})
const { data: mainCategories } = await useFetch<MainCategory[]>('/api/main-categories', { default: () => [] })
const { data: categories } = await useFetch('/api/categories', { default: () => [] })

const search = ref('')
const filterStatus = ref<ProductStatus | ''>('')
const filterCategory = ref('')

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
    || p.category?.name.toLowerCase().includes(q),
  )
})

const stats = computed(() => {
  const list = products.value ?? []
  return {
    total: list.length,
    published: list.filter(p => p.status === 'published').length,
    pending: list.filter(p => p.status === 'pending').length,
    draft: list.filter(p => p.status === 'draft').length,
  }
})

function categoriesForMain(mainId: string) {
  return (categories.value ?? []).filter((c: { main_category_id: string }) => c.main_category_id === mainId)
}

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
  if (!confirm(`ลบสินค้า "${p.name}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/products/${p.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
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
        <NuxtLink
          to="/admin/products/new"
          class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          เพิ่มสินค้า
        </NuxtLink>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">ทั้งหมด</p>
        <p class="mt-1 text-2xl font-bold">{{ stats.total }}</p>
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
            placeholder="ค้นหาชื่อ / SKU..."
            class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
          >
        </div>
        <select v-model="filterStatus" class="rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          <option v-for="o in statusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <select v-model="filterCategory" class="min-w-[160px] rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          <option value="">ทุกหมวดหมู่</option>
          <optgroup v-for="main in mainCategories" :key="main.id" :label="main.name">
            <option v-for="c in categoriesForMain(main.id)" :key="c.id" :value="c.id">{{ c.name }}</option>
          </optgroup>
        </select>
      </div>

      <div v-if="fetchError" class="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ fetchError.message }}
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[800px] text-sm">
          <thead>
            <tr class="border-b bg-gray-50/80 text-left text-xs font-semibold uppercase text-gray-500">
              <th class="px-4 py-3">สินค้า</th>
              <th class="px-4 py-3">SKU</th>
              <th class="px-4 py-3">หมวดหมู่</th>
              <th class="px-4 py-3">ราคา</th>
              <th class="px-4 py-3">สถานะ</th>
              <th class="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="6" class="py-16 text-center text-gray-400">กำลังโหลด...</td>
            </tr>
            <tr v-else-if="!filtered.length">
              <td colspan="6" class="py-16 text-center">
                <p class="text-gray-500">ยังไม่มีสินค้า</p>
                <NuxtLink to="/admin/products/new" class="mt-3 inline-block text-sm font-semibold text-red-500 hover:underline">
                  + เพิ่มสินค้าแรก
                </NuxtLink>
              </td>
            </tr>
            <tr v-for="p in filtered" v-else :key="p.id" class="hover:bg-gray-50/80">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                    <img v-if="p.image_url" :src="p.image_url" :alt="p.name" class="h-full w-full object-cover">
                    <div v-else class="flex h-full items-center justify-center">
                      <Icon name="heroicons:photo" class="h-5 w-5 text-gray-300" />
                    </div>
                  </div>
                  <p class="font-medium text-gray-900">{{ p.name }}</p>
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
              <td class="px-4 py-3 text-right">
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
    </section>
  </div>
</template>
