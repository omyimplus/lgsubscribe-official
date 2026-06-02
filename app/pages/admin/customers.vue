<script setup lang="ts">
import type { CustomerProfile } from '~~/shared/types/customer'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth', 'admin-role'],
})

const { data: customers, pending, refresh, error: fetchError } = await useFetch<CustomerProfile[]>('/api/admin/customers', {
  default: () => [],
})

const search = ref('')
const consentFilter = ref<'all' | 'yes' | 'no'>('all')

const filtered = computed(() => {
  const list = customers.value ?? []
  const q = search.value.trim().toLowerCase()

  return list.filter((c) => {
    if (consentFilter.value === 'yes' && !c.marketing_consent) return false
    if (consentFilter.value === 'no' && c.marketing_consent) return false

    if (!q) return true
    return (
      c.email.toLowerCase().includes(q)
      || c.full_name.toLowerCase().includes(q)
      || c.phone.toLowerCase().includes(q)
      || c.line_id.toLowerCase().includes(q)
    )
  })
})

const stats = computed(() => {
  const list = customers.value ?? []
  return {
    total: list.length,
    consentYes: list.filter(c => c.marketing_consent).length,
    consentNo: list.filter(c => !c.marketing_consent).length,
  }
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const CUSTOMER_EXPORT_HEADER = [
  'ชื่อ-นามสกุล',
  'อีเมล',
  'เบอร์โทร',
  'Line ID',
  'หมายเหตุ',
  'การยินยอม',
  'สร้างเมื่อ',
  'อัปเดตล่าสุด',
] as const

const exportingCsv = ref(false)
const exportingExcel = ref(false)

const exportDisabled = computed(() => pending.value || !filtered.value.length)

function buildCustomerExportRows() {
  return filtered.value.map(c => [
    c.full_name,
    c.email,
    c.phone,
    c.line_id,
    c.contact_note,
    c.marketing_consent ? 'ยินยอม' : 'ไม่ยินยอม',
    formatDate(c.created_at),
    formatDate(c.updated_at),
  ])
}

function exportCustomersCsv() {
  exportingCsv.value = true
  try {
    downloadCsv(exportFilenameStamp('customers'), [
      [...CUSTOMER_EXPORT_HEADER],
      ...buildCustomerExportRows(),
    ])
  }
  finally {
    exportingCsv.value = false
  }
}

async function exportCustomersExcel() {
  exportingExcel.value = true
  try {
    await downloadExcel(exportFilenameStamp('customers'), 'ลูกค้า', [
      [...CUSTOMER_EXPORT_HEADER],
      ...buildCustomerExportRows(),
    ])
  }
  finally {
    exportingExcel.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="ลูกค้า"
      description="รายชื่อลูกค้าที่สมัครสมาชิกบนเว็บไซต์ พร้อมข้อมูลสำหรับติดต่อกลับ"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="exportDisabled || exportingCsv || exportingExcel"
          @click="exportCustomersCsv"
        >
          <Icon
            :name="exportingCsv ? 'heroicons:arrow-path' : 'heroicons:arrow-down-tray'"
            class="h-4 w-4"
            :class="{ 'animate-spin': exportingCsv }"
          />
          Export CSV
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="exportDisabled || exportingCsv || exportingExcel"
          @click="exportCustomersExcel"
        >
          <Icon
            :name="exportingExcel ? 'heroicons:arrow-path' : 'heroicons:arrow-down-tray'"
            class="h-4 w-4"
            :class="{ 'animate-spin': exportingExcel }"
          />
          Export Excel
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          @click="refresh()"
        >
          <Icon name="heroicons:arrow-path" class="h-4 w-4" />
          รีเฟรช
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">ลูกค้าทั้งหมด</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">ยินยอมรับข่าวสาร</p>
        <p class="mt-1 text-2xl font-bold text-emerald-600">{{ stats.consentYes }}</p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">ไม่ยินยอม</p>
        <p class="mt-1 text-2xl font-bold text-gray-500">{{ stats.consentNo }}</p>
      </div>
    </div>

    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative w-full sm:max-w-sm">
            <Icon
              name="heroicons:magnifying-glass"
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="search"
              type="search"
              placeholder="ค้นหาอีเมล ชื่อ เบอร์ หรือ Line ID..."
              class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
            >
          </div>
          <select
            v-model="consentFilter"
            class="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
          >
            <option value="all">ทุกสถานะการยินยอม</option>
            <option value="yes">ยินยอมรับข่าวสาร</option>
            <option value="no">ไม่ยินยอม</option>
          </select>
        </div>
        <p class="text-xs text-gray-400">แสดง {{ filtered.length }} รายการ</p>
      </div>

      <div
        v-if="fetchError"
        class="mx-4 my-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 sm:mx-6"
      >
        <p class="font-medium">โหลดข้อมูลลูกค้าไม่สำเร็จ</p>
        <p class="mt-1 text-xs opacity-90">
          {{ fetchError.message || 'กรุณาตรวจ migration 0011_customer_profiles.sql' }}
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[980px] text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th class="px-6 py-3">ชื่อ</th>
              <th class="px-6 py-3">อีเมล</th>
              <th class="px-6 py-3">เบอร์โทร</th>
              <th class="px-6 py-3">Line ID</th>
              <th class="px-6 py-3">การยินยอม</th>
              <th class="px-6 py-3">สร้างเมื่อ</th>
              <th class="px-6 py-3">อัปเดตล่าสุด</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="7" class="px-6 py-16 text-center text-gray-400">
                <Icon name="heroicons:arrow-path" class="mx-auto mb-2 h-6 w-6 animate-spin" />
                กำลังโหลด...
              </td>
            </tr>
            <tr v-else-if="!filtered.length">
              <td colspan="7" class="px-6 py-16 text-center text-gray-500">
                ยังไม่มีข้อมูลลูกค้า
              </td>
            </tr>
            <tr v-for="c in filtered" v-else :key="c.id" class="transition-colors hover:bg-gray-50/80">
              <td class="px-6 py-4 font-medium text-gray-900">{{ c.full_name || '—' }}</td>
              <td class="px-6 py-4 text-gray-600">{{ c.email }}</td>
              <td class="px-6 py-4 text-gray-600">{{ c.phone || '—' }}</td>
              <td class="px-6 py-4 text-gray-600">{{ c.line_id || '—' }}</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="c.marketing_consent ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ c.marketing_consent ? 'ยินยอม' : 'ไม่ยินยอม' }}
                </span>
              </td>
              <td class="px-6 py-4 text-gray-500">{{ formatDate(c.created_at) }}</td>
              <td class="px-6 py-4 text-gray-500">{{ formatDate(c.updated_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
