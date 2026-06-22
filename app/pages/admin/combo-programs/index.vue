<script setup lang="ts">
import type { ComboCustomerSegment, ComboProgramInput, ComboProgramListRow } from '~~/shared/types/comboProgram'
import {
  comboSegmentLabels,
  comboStatusLabels,
} from '~~/shared/utils/comboProgramDisplay'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: programs, pending, error: fetchError, refresh } = await useFetch<ComboProgramListRow[]>(
  '/api/admin/combo-programs',
  { default: () => [] },
)

const search = ref('')
const segmentFilter = ref<'all' | ComboCustomerSegment>('all')

const filtered = computed(() => {
  let list = programs.value ?? []
  if (segmentFilter.value !== 'all') {
    list = list.filter(p => p.customer_segment === segmentFilter.value)
  }
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(p => p.name.toLowerCase().includes(q))
})

const stats = computed(() => {
  const list = programs.value ?? []
  return {
    total: list.length,
    published: list.filter(p => p.status === 'published').length,
    newSegment: list.filter(p => p.customer_segment === 'new').length,
    existingSegment: list.filter(p => p.customer_segment === 'existing').length,
  }
})

const dialogOpen = ref(false)
const saving = ref(false)
const formError = ref('')
const createForm = reactive({
  name: '',
  customer_segment: 'new' as ComboCustomerSegment,
})

function openCreate() {
  createForm.name = ''
  createForm.customer_segment = 'new'
  formError.value = ''
  dialogOpen.value = true
}

const defaultTiers: ComboProgramInput['tiers'] = [
  { min_items: 2, max_items: null, extra_discount_percent: 10, sort_order: 0 },
  { min_items: 5, max_items: null, extra_discount_percent: 15, sort_order: 1 },
  { min_items: 7, max_items: null, extra_discount_percent: 20, sort_order: 2 },
]

async function handleCreate() {
  formError.value = ''
  if (!createForm.name.trim()) {
    formError.value = 'กรุณากรอกชื่อโปรแกรม'
    return
  }

  saving.value = true
  try {
    const created = await $fetch<{ id: string }>('/api/admin/combo-programs', {
      method: 'POST',
      body: {
        name: createForm.name.trim(),
        customer_segment: createForm.customer_segment,
        tier_mode: 'stepped',
        status: 'draft',
        tiers: defaultTiers,
      } satisfies ComboProgramInput,
    })
    dialogOpen.value = false
    await navigateTo(`/admin/combo-programs/${created.id}`)
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'สร้างไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}

async function handleDelete(row: ComboProgramListRow) {
  if (!confirm(`ลบโปรแกรม "${row.name}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/admin/combo-programs/${row.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}

function formatDateRange(p: ComboProgramListRow) {
  if (!p.starts_at && !p.ends_at) return 'ไม่กำหนด'
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  if (p.starts_at && p.ends_at) return `${fmt(p.starts_at)} – ${fmt(p.ends_at)}`
  if (p.starts_at) return `ตั้งแต่ ${fmt(p.starts_at)}`
  return `ถึง ${fmt(p.ends_at!)}`
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="Combo ส่วนลดหลายชิ้น"
      description="ตั้งค่าส่วนลดเพิ่มตามจำนวนชิ้นและกลุ่มลูกค้า (ใหม่/เก่า) — Phase 1 ตั้งค่าหลังบ้าน"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
          @click="openCreate"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          สร้างโปรแกรม Combo
        </button>
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
        <p class="text-xs uppercase text-gray-400">ลูกค้าใหม่</p>
        <p class="mt-1 text-2xl font-bold text-sky-600">{{ stats.newSegment }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">ลูกค้าเก่า</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ stats.existingSegment }}</p>
      </div>
    </div>

    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
        <div class="relative max-w-xs flex-1">
          <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            v-model="search"
            type="search"
            placeholder="ค้นหาชื่อโปรแกรม..."
            class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
          >
        </div>
        <select
          v-model="segmentFilter"
          class="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
        >
          <option value="all">ทุกกลุ่มลูกค้า</option>
          <option value="new">ลูกค้าใหม่</option>
          <option value="existing">ลูกค้าเก่า</option>
        </select>
      </div>

      <div v-if="fetchError" class="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ fetchError.message || 'ตรวจ migration 0029_combo_programs.sql' }}
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm">
          <thead>
            <tr class="border-b bg-gray-50/80 text-left text-xs font-semibold uppercase text-gray-500">
              <th class="px-4 py-3">ชื่อโปรแกรม</th>
              <th class="px-4 py-3">กลุ่มลูกค้า</th>
              <th class="px-4 py-3">ชั้นส่วนลด</th>
              <th class="px-4 py-3">ช่วงเวลา</th>
              <th class="px-4 py-3">สถานะ</th>
              <th class="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="6" class="py-16 text-center text-gray-400">กำลังโหลด...</td>
            </tr>
            <tr v-else-if="!filtered.length">
              <td colspan="6" class="py-16 text-center text-gray-500">ยังไม่มีโปรแกรม Combo</td>
            </tr>
            <tr v-for="row in filtered" v-else :key="row.id" class="hover:bg-gray-50/80">
              <td class="px-4 py-3 font-medium text-gray-900">{{ row.name }}</td>
              <td class="px-4 py-3 text-gray-700">{{ comboSegmentLabels[row.customer_segment] }}</td>
              <td class="px-4 py-3 text-gray-600">{{ row.tier_count }} ชั้น</td>
              <td class="px-4 py-3 text-gray-600">{{ formatDateRange(row) }}</td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="row.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ comboStatusLabels[row.status] }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <NuxtLink
                  :to="`/admin/combo-programs/${row.id}`"
                  class="inline-flex rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Icon name="heroicons:pencil-square" class="h-4 w-4" />
                </NuxtLink>
                <button
                  type="button"
                  class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  @click="handleDelete(row)"
                >
                  <Icon name="heroicons:trash" class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
      v-if="dialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="dialogOpen = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-gray-900">สร้างโปรแกรม Combo</h2>
        <p class="mt-1 text-xs text-gray-500">
          สร้างพร้อมชั้นตัวอย่าง 1 ชิ้น / 2 ชิ้น — แก้ % ได้ในหน้าถัดไป
        </p>
        <form class="mt-4 space-y-4" @submit.prevent="handleCreate">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อโปรแกรม *</label>
            <input
              v-model="createForm.name"
              type="text"
              required
              class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              placeholder="เช่น Combo ลูกค้าใหม่ มิ.ย. 2569"
            >
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">กลุ่มลูกค้า *</label>
            <select
              v-model="createForm.customer_segment"
              class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            >
              <option value="new">ลูกค้าใหม่</option>
              <option value="existing">ลูกค้าเก่า</option>
            </select>
          </div>
          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" @click="dialogOpen = false">
              ยกเลิก
            </button>
            <button
              type="submit"
              class="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? 'กำลังสร้าง...' : 'สร้างและตั้งค่า' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
