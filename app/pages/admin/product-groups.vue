<script setup lang="ts">
import type { Category } from '~~/shared/types/category'
import type { MainCategory } from '~~/shared/types/main-category'
import type { ProductGroupInput, ProductGroupMember, ProductGroupWithMembers } from '~~/shared/types/product'
import { categoriesGroupedByMain, categoriesInDisplayOrder, defaultCategoryId } from '~~/shared/utils/categoryDisplay'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const { data: groups, refresh, pending, error: fetchError } = await useFetch<ProductGroupWithMembers[]>('/api/product-groups', {
  default: () => [],
})

const { data: categories } = await useFetch<Category[]>('/api/categories', {
  default: () => [],
})

const { data: mainCategories } = await useFetch<MainCategory[]>('/api/main-categories', {
  default: () => [],
})

const categoryPickerGroups = computed(() =>
  categoriesGroupedByMain(mainCategories.value ?? [], categories.value ?? []),
)

const search = ref('')
const filtered = computed(() => {
  const list = groups.value ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(g =>
    g.display_name.toLowerCase().includes(q)
    || g.group_key.toLowerCase().includes(q)
    || g.category?.name.toLowerCase().includes(q)
    || g.products.some(p =>
      p.sku.toLowerCase().includes(q)
      || p.name.toLowerCase().includes(q),
    ),
  )
})

const groupedByCategory = computed(() => {
  const list = filtered.value
  return categoriesInDisplayOrder(mainCategories.value ?? [], categories.value ?? [])
    .map(cat => ({
      category: cat,
      items: list
        .filter(g => g.category_id === cat.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter(g => g.items.length > 0)
})

const stats = computed(() => {
  const list = groups.value ?? []
  const skus = list.reduce((n, g) => n + g.products.length, 0)
  return {
    groups: list.length,
    skus,
    active: list.filter(g => g.is_active).length,
    locked: list.flatMap(g => g.products).filter(p => p.group_id_locked).length,
  }
})

const NONE_GROUP = '__none__'
const saving = ref(false)
const formError = ref('')

// ---------- Create group ----------
const createOpen = ref(false)
const createForm = reactive<ProductGroupInput>({
  display_name: '',
  category_id: '',
})

function openCreate() {
  createForm.display_name = ''
  createForm.category_id = defaultCategoryId(mainCategories.value ?? [], categories.value ?? '')
  formError.value = ''
  createOpen.value = true
}

async function handleCreate() {
  formError.value = ''
  if (!createForm.display_name.trim() || !createForm.category_id) {
    formError.value = 'กรุณากรอกชื่อกลุ่มและเลือกหมวดหมู่'
    return
  }
  saving.value = true
  try {
    await $fetch('/api/product-groups', {
      method: 'POST',
      body: {
        display_name: createForm.display_name.trim(),
        category_id: createForm.category_id,
      },
    })
    createOpen.value = false
    await refresh()
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'สร้างกลุ่มไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}

// ---------- Edit display name ----------
const editOpen = ref(false)
const editingGroup = ref<ProductGroupWithMembers | null>(null)
const editName = ref('')

function openEdit(g: ProductGroupWithMembers) {
  editingGroup.value = g
  editName.value = g.display_name
  formError.value = ''
  editOpen.value = true
}

async function handleEditSave() {
  if (!editingGroup.value) return
  formError.value = ''
  if (!editName.value.trim()) {
    formError.value = 'กรุณากรอกชื่อกลุ่ม'
    return
  }
  saving.value = true
  try {
    await $fetch(`/api/product-groups/${editingGroup.value.id}`, {
      method: 'PATCH',
      body: { display_name: editName.value.trim() },
    })
    editOpen.value = false
    await refresh()
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'บันทึกไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}

async function toggleActive(g: ProductGroupWithMembers) {
  try {
    await $fetch(`/api/product-groups/${g.id}`, {
      method: 'PATCH',
      body: { is_active: !g.is_active },
    })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'อัพเดทไม่สำเร็จ')
  }
}

function groupsInCategory(categoryId: string) {
  return (groups.value ?? [])
    .filter(g => g.category_id === categoryId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

async function reorderCategory(categoryId: string, ids: string[]) {
  try {
    await $fetch('/api/product-groups/reorder', {
      method: 'PATCH',
      body: { ids },
    })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'จัดลำดับไม่สำเร็จ')
  }
}

function moveGroup(categoryId: string, groupId: string, direction: -1 | 1) {
  const items = groupsInCategory(categoryId)
  const idx = items.findIndex(g => g.id === groupId)
  const target = idx + direction
  if (idx < 0 || target < 0 || target >= items.length) return
  const ids = items.map(g => g.id)
  const tmp = ids[idx]!
  ids[idx] = ids[target]!
  ids[target] = tmp
  return reorderCategory(categoryId, ids)
}

function moveOptionsFor(product: ProductGroupMember, currentGroup: ProductGroupWithMembers) {
  const sameCategory = (groups.value ?? []).filter(g => g.category_id === currentGroup.category_id)
  return [
    { value: NONE_GROUP, label: 'ไม่มีกลุ่ม' },
    ...sameCategory
      .filter(g => g.id !== currentGroup.id)
      .map(g => ({ value: g.id, label: g.display_name })),
  ]
}

const movingProductId = ref<string | null>(null)

async function handleMoveProduct(
  product: ProductGroupMember,
  fromGroup: ProductGroupWithMembers,
  targetGroupId: string,
) {
  if (targetGroupId === fromGroup.id) return
  movingProductId.value = product.id
  try {
    if (targetGroupId === NONE_GROUP) {
      await $fetch(`/api/product-groups/${fromGroup.id}/members`, {
        method: 'PATCH',
        body: { remove: [product.id] },
      })
    }
    else {
      await $fetch(`/api/product-groups/${targetGroupId}/members`, {
        method: 'PATCH',
        body: { add: [product.id] },
      })
    }
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ย้าย SKU ไม่สำเร็จ')
  }
  finally {
    movingProductId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="กลุ่มสินค้า (PLP)"
      description="จัดกลุ่ม SKU เป็นการ์ดเดียวบนหน้ารายการสินค้า — การย้ายด้วยมือจะล็อกไม่ให้ Import ทับ"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-500/25 transition hover:bg-red-600 active:scale-[0.98]"
          @click="openCreate"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          สร้างกลุ่มใหม่
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">กลุ่มทั้งหมด</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats.groups }}</p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">SKU ในกลุ่ม</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats.skus }}</p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">เปิดใช้งาน</p>
        <p class="mt-1 text-2xl font-bold text-emerald-600">{{ stats.active }}</p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">SKU ล็อกแล้ว</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ stats.locked }}</p>
      </div>
    </div>

    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div class="relative w-full sm:max-w-sm">
          <Icon
            name="heroicons:magnifying-glass"
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            type="search"
            placeholder="ค้นหาชื่อกลุ่ม SKU..."
            class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
          >
        </div>
        <p class="text-xs text-gray-400">
          แสดง {{ filtered.length }} กลุ่ม
        </p>
      </div>

      <div
        v-if="fetchError"
        class="mx-4 my-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 sm:mx-6"
      >
        <p class="font-medium">โหลดข้อมูลไม่สำเร็จ</p>
        <p class="mt-1 text-xs opacity-90">
          {{ fetchError.message || 'รัน migration 0020 ใน Supabase' }}
        </p>
      </div>

      <div class="overflow-x-auto">
        <div v-if="pending" class="px-6 py-16 text-center text-gray-400">
          <Icon name="heroicons:arrow-path" class="mx-auto mb-2 h-6 w-6 animate-spin" />
          กำลังโหลด...
        </div>
        <div v-else-if="!groupedByCategory.length" class="px-6 py-16 text-center">
          <div class="mx-auto flex max-w-xs flex-col items-center gap-3">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Icon name="heroicons:squares-2x2" class="h-7 w-7 text-gray-400" />
            </div>
            <div>
              <p class="font-medium text-gray-700">ยังไม่มีกลุ่มสินค้า</p>
              <p class="mt-1 text-xs text-gray-400">Import จาก LG หรือสร้างกลุ่มด้วยมือ</p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              @click="openCreate"
            >
              <Icon name="heroicons:plus" class="h-4 w-4" />
              สร้างกลุ่มใหม่
            </button>
          </div>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="section in groupedByCategory"
            :key="section.category.id"
            class="px-4 py-4 sm:px-6"
          >
            <div class="mb-3 flex items-center gap-2">
              <span class="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                {{ section.category.name }}
              </span>
              <span class="text-xs text-gray-400">{{ section.items.length }} กลุ่ม</span>
            </div>

            <div class="space-y-4">
              <div
                v-for="(g, gIdx) in section.items"
                :key="g.id"
                class="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="font-semibold text-gray-900">
                        {{ g.display_name }}
                      </h3>
                      <span class="tabular-nums text-xs text-gray-400">#{{ g.sort_order }}</span>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        :class="g.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'"
                        @click="toggleActive(g)"
                      >
                        {{ g.is_active ? 'เปิด' : 'ปิด' }}
                      </button>
                    </div>
                    <p class="mt-1 font-mono text-xs text-gray-400">
                      {{ g.group_key }}
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      class="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-30"
                      :disabled="gIdx === 0"
                      title="เลื่อนขึ้น"
                      @click="moveGroup(section.category.id, g.id, -1)"
                    >
                      <Icon name="heroicons:chevron-up" class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-30"
                      :disabled="gIdx === section.items.length - 1"
                      title="เลื่อนลง"
                      @click="moveGroup(section.category.id, g.id, 1)"
                    >
                      <Icon name="heroicons:chevron-down" class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700"
                      @click="openEdit(g)"
                    >
                      <Icon name="heroicons:pencil-square" class="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <ul v-if="g.products.length" class="mt-3 space-y-2">
                  <li
                    v-for="p in g.products"
                    :key="p.id"
                    class="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm"
                  >
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      <img
                        v-if="p.image_url"
                        :src="p.image_url"
                        :alt="p.name"
                        class="h-full w-full object-contain p-0.5"
                      >
                      <Icon v-else name="heroicons:photo" class="h-4 w-4 text-gray-300" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-medium text-gray-900">
                        {{ p.variant_label || p.name }}
                      </p>
                      <p class="text-xs text-gray-500">
                        <code>{{ p.sku }}</code>
                        <span v-if="p.group_id_locked" class="ml-2 text-amber-600">ล็อก</span>
                      </p>
                    </div>
                    <label class="flex items-center gap-2 text-xs text-gray-500">
                      <span class="shrink-0">ย้ายไป</span>
                      <select
                        class="max-w-[12rem] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-red-300 focus:ring-2 focus:ring-red-500/10"
                        :disabled="movingProductId === p.id"
                        :value="g.id"
                        @change="handleMoveProduct(p, g, ($event.target as HTMLSelectElement).value)"
                      >
                        <option :value="g.id" disabled>
                          — กลุ่มปัจจุบัน —
                        </option>
                        <option
                          v-for="opt in moveOptionsFor(p, g)"
                          :key="opt.value"
                          :value="opt.value"
                        >
                          {{ opt.label }}
                        </option>
                      </select>
                    </label>
                  </li>
                </ul>
                <p v-else class="mt-3 text-xs text-gray-400">
                  ไม่มี SKU ในกลุ่มนี้
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <AdminModal v-model="createOpen" title="สร้างกลุ่มสินค้าใหม่">
      <form id="pg-create-form" class="space-y-4" @submit.prevent="handleCreate">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">
            หมวดหมู่ <span class="text-red-500">*</span>
          </label>
          <select
            v-model="createForm.category_id"
            required
            class="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
            <option value="" disabled>เลือกหมวด...</option>
            <optgroup v-for="g in categoryPickerGroups" :key="g.main.id" :label="g.main.name">
              <option v-for="c in g.categories" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </optgroup>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">
            ชื่อการ์ดกลาง <span class="text-red-500">*</span>
          </label>
          <input
            v-model="createForm.display_name"
            type="text"
            required
            placeholder="เช่น ทีวี LG OLED"
            class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
        </div>
        <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ formError }}
        </p>
      </form>
      <template #footer>
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200/80"
          :disabled="saving"
          @click="createOpen = false"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          form="pg-create-form"
          class="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-60"
          :disabled="saving"
        >
          {{ saving ? 'กำลังบันทึก...' : 'สร้างกลุ่ม' }}
        </button>
      </template>
    </AdminModal>

    <AdminModal v-model="editOpen" title="แก้ไขชื่อกลุ่ม">
      <form id="pg-edit-form" class="space-y-4" @submit.prevent="handleEditSave">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">ชื่อการ์ดกลาง</label>
          <input
            v-model="editName"
            type="text"
            required
            class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
        </div>
        <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ formError }}
        </p>
      </form>
      <template #footer>
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200/80"
          :disabled="saving"
          @click="editOpen = false"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          form="pg-edit-form"
          class="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-60"
          :disabled="saving"
        >
          {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </template>
    </AdminModal>
  </div>
</template>
