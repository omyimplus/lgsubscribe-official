<script setup lang="ts">
import type { LpApplication, LpApplicationStatus } from '~~/shared/types/lpApplication'
import { LP_STATUS_LABELS, lpApplicantDisplayName } from '~~/shared/utils/lpApplicationDisplay'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: applications, pending, refresh, error: fetchError } = await useFetch<LpApplication[]>(
  '/api/admin/lp-applications',
  { default: () => [] },
)

const search = ref('')
const statusFilter = ref<'all' | LpApplicationStatus>('all')
const updatingId = ref<string | null>(null)
const detailOpen = ref(false)
const selected = ref<LpApplication | null>(null)

const filtered = computed(() => {
  const list = applications.value ?? []
  const q = search.value.trim().toLowerCase()
  return list.filter((row) => {
    if (statusFilter.value !== 'all' && row.status !== statusFilter.value) return false
    if (!q) return true
    const name = lpApplicantDisplayName(row.first_name, row.last_name).toLowerCase()
    return (
      name.includes(q)
      || row.contact_phone.includes(q)
      || row.email.toLowerCase().includes(q)
      || row.line_id.toLowerCase().includes(q)
      || row.province.toLowerCase().includes(q)
    )
  })
})

const stats = computed(() => {
  const list = applications.value ?? []
  return {
    total: list.length,
    new: list.filter(i => i.status === 'new').length,
    contacted: list.filter(i => i.status === 'contacted').length,
    closed: list.filter(i => i.status === 'closed').length,
  }
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

function statusClass(s: LpApplicationStatus) {
  if (s === 'new') return 'bg-sky-100 text-sky-800 ring-sky-200/60'
  if (s === 'contacted') return 'bg-amber-100 text-amber-900 ring-amber-200/60'
  return 'bg-gray-100 text-gray-600 ring-gray-200/60'
}

function openDetail(row: LpApplication) {
  selected.value = row
  detailOpen.value = true
}

async function updateStatus(id: string, status: LpApplicationStatus) {
  updatingId.value = id
  try {
    const updated = await $fetch<LpApplication>(`/api/admin/lp-applications/${id}`, {
      method: 'PATCH',
      body: { status },
    })
    await refresh()
    if (selected.value?.id === id) selected.value = updated
  }
  finally {
    updatingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">
        ใบสมัคร LP
      </h1>
      <p class="mt-1 text-sm text-gray-600">
        Lifestyle Planner — ตัวแทน LG Subscribe จากหน้าแรก
      </p>
    </div>

    <div class="grid gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <p class="text-xs text-gray-500">ทั้งหมด</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
        <p class="text-xs text-sky-700">ใหม่</p>
        <p class="text-2xl font-bold text-sky-800">{{ stats.new }}</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <p class="text-xs text-amber-800">ติดต่อแล้ว</p>
        <p class="text-2xl font-bold text-amber-900">{{ stats.contacted }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p class="text-xs text-gray-500">ปิดแล้ว</p>
        <p class="text-2xl font-bold text-gray-600">{{ stats.closed }}</p>
      </div>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        v-model="search"
        type="search"
        placeholder="ค้นหาชื่อ, โทร, อีเมล, Line, จังหวัด..."
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:max-w-md"
      >
      <select
        v-model="statusFilter"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="all">สถานะทั้งหมด</option>
        <option value="new">ใหม่</option>
        <option value="contacted">ติดต่อแล้ว</option>
        <option value="closed">ปิดแล้ว</option>
      </select>
    </div>

    <p v-if="fetchError" class="text-sm text-red-600">
      โหลดข้อมูลไม่สำเร็จ
    </p>

    <div v-if="pending" class="py-12 text-center text-sm text-gray-400">
      กำลังโหลด...
    </div>

    <div v-else-if="!filtered.length" class="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-500">
      ยังไม่มีใบสมัคร LP
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="row in filtered"
        :key="row.id"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300"
      >
        <button
          type="button"
          class="w-full text-left"
          @click="openDetail(row)"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-semibold text-gray-900">
                  {{ lpApplicantDisplayName(row.first_name, row.last_name) }}
                </h3>
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset"
                  :class="statusClass(row.status)"
                >
                  {{ LP_STATUS_LABELS[row.status] }}
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-600">
                {{ row.province }} · {{ row.contact_phone }}
              </p>
              <p class="text-xs text-gray-500">
                {{ row.email }} · Line: {{ row.line_id }}
              </p>
            </div>
            <p class="shrink-0 text-xs text-gray-400">
              {{ formatDate(row.created_at) }}
            </p>
          </div>
        </button>
      </li>
    </ul>

    <LpApplicationDetailModal
      v-model:open="detailOpen"
      :application="selected"
      :updating="updatingId === selected?.id"
      @update:status="(s) => selected && updateStatus(selected.id, s)"
    />
  </div>
</template>
