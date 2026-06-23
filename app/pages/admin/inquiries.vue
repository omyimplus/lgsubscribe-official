<script setup lang="ts">
import type { InquiryStatus, SubscriptionInquiry } from '~~/shared/types/inquiry'
import { comboSegmentLabels } from '~~/shared/utils/comboProgramDisplay'
import { inquirySourceLabel } from '~~/shared/utils/inquirySource'
import {
  buildInquiryItemExportRows,
  buildInquirySummaryExportRows,
  INQUIRY_EXPORT_HEADERS,
  INQUIRY_ITEM_EXPORT_HEADERS,
} from '~~/shared/utils/inquiryExport'
import { downloadCsv } from '~/utils/downloadCsv'
import { downloadExcelWorkbook } from '~/utils/downloadExcel'
import { exportFilenameStamp } from '~/utils/exportFilename'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: inquiries, pending, refresh, error: fetchError } = await useFetch<SubscriptionInquiry[]>(
  '/api/admin/subscribe-inquiries',
  { default: () => [] },
)

const search = ref('')
const statusFilter = ref<'all' | InquiryStatus>('all')
const updatingId = ref<string | null>(null)
const detailOpen = ref(false)
const selectedInquiry = ref<SubscriptionInquiry | null>(null)

const filtered = computed(() => {
  const list = inquiries.value ?? []
  const q = search.value.trim().toLowerCase()

  return list.filter((row) => {
    if (statusFilter.value !== 'all' && row.status !== statusFilter.value) return false
    if (!q) return true
    const p = row.contact_profile
    return (
      row.contact_name.toLowerCase().includes(q)
      || row.contact_phone.toLowerCase().includes(q)
      || row.contact_line_id.toLowerCase().includes(q)
      || (p?.company_name?.toLowerCase().includes(q) ?? false)
      || (p?.first_name?.toLowerCase().includes(q) ?? false)
      || (p?.last_name?.toLowerCase().includes(q) ?? false)
      || (p?.director_first_name?.toLowerCase().includes(q) ?? false)
      || (p?.director_last_name?.toLowerCase().includes(q) ?? false)
      || (row.items ?? []).some(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
    )
  })
})

const stats = computed(() => {
  const list = inquiries.value ?? []
  return {
    total: list.length,
    new: list.filter(i => i.status === 'new').length,
    contacted: list.filter(i => i.status === 'contacted').length,
    closed: list.filter(i => i.status === 'closed').length,
  }
})

const statCards = computed(() => [
  {
    key: 'all' as const,
    label: 'ทั้งหมด',
    value: stats.value.total,
    hint: 'คำขอทั้งหมด',
    icon: 'heroicons:inbox-stack',
    cardClass: 'border-gray-200/80 bg-white',
    iconWrap: 'bg-gray-100 text-gray-600',
    valueClass: 'text-gray-900',
  },
  {
    key: 'new' as const,
    label: 'ใหม่',
    value: stats.value.new,
    hint: 'รอติดต่อ',
    icon: 'heroicons:bell-alert',
    cardClass: 'border-sky-200/80 bg-sky-50/40',
    iconWrap: 'bg-sky-500 text-white',
    valueClass: 'text-sky-700',
  },
  {
    key: 'contacted' as const,
    label: 'ติดต่อแล้ว',
    value: stats.value.contacted,
    hint: 'กำลังดำเนินการ',
    icon: 'heroicons:phone-arrow-up-right',
    cardClass: 'border-amber-200/80 bg-amber-50/40',
    iconWrap: 'bg-amber-500 text-white',
    valueClass: 'text-amber-800',
  },
  {
    key: 'closed' as const,
    label: 'ปิดแล้ว',
    value: stats.value.closed,
    hint: 'เสร็จสิ้น',
    icon: 'heroicons:check-badge',
    cardClass: 'border-gray-200/80 bg-gray-50/80',
    iconWrap: 'bg-gray-400 text-white',
    valueClass: 'text-gray-600',
  },
])

const statusFilters = [
  { value: 'all' as const, label: 'ทั้งหมด' },
  { value: 'new' as const, label: 'ใหม่' },
  { value: 'contacted' as const, label: 'ติดต่อแล้ว' },
  { value: 'closed' as const, label: 'ปิดแล้ว' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'เมื่อสักครู่'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชม. ที่แล้ว`
  const days = Math.floor(hours / 24)
  return `${days} วันที่แล้ว`
}

function statusLabel(s: InquiryStatus) {
  if (s === 'new') return 'ใหม่'
  if (s === 'contacted') return 'ติดต่อแล้ว'
  return 'ปิดแล้ว'
}

function statusClass(s: InquiryStatus) {
  if (s === 'new') return 'bg-sky-100 text-sky-800 ring-sky-200/60'
  if (s === 'contacted') return 'bg-amber-100 text-amber-900 ring-amber-200/60'
  return 'bg-gray-100 text-gray-600 ring-gray-200/60'
}

function statusAccentClass(s: InquiryStatus) {
  if (s === 'new') return 'border-l-sky-500'
  if (s === 'contacted') return 'border-l-amber-500'
  return 'border-l-gray-300'
}

function applicantLabel(row: SubscriptionInquiry) {
  return (row.applicant_type ?? 'individual') === 'corporate' ? 'นิติบุคคล' : 'บุคคลธรรมดา'
}

function contactSubtitle(row: SubscriptionInquiry) {
  const p = row.contact_profile
  if ((row.applicant_type ?? p?.applicant_type) !== 'corporate' || !p?.company_name) return null
  const director = [p.director_first_name, p.director_last_name].filter(Boolean).join(' ')
  if (director) return `${p.company_name} · กรรมการ ${director}`
  return p.company_name
}

function comboSummary(row: SubscriptionInquiry) {
  const snap = row.combo_snapshot
  if (!snap?.quote) return null
  const pct = snap.quote.percent
  const segment = row.combo_customer_segment ?? snap.customer_segment
  return {
    segment,
    segmentLabel: comboSegmentLabels[segment],
    percent: pct,
    hasDiscount: pct > 0,
  }
}

function setStatusFilter(value: typeof statusFilter.value) {
  statusFilter.value = value
}

function openDetail(row: SubscriptionInquiry) {
  selectedInquiry.value = row
  detailOpen.value = true
}

watch(inquiries, (list) => {
  if (!detailOpen.value || !selectedInquiry.value || !list) return
  const updated = list.find(i => i.id === selectedInquiry.value!.id)
  if (updated) selectedInquiry.value = updated
})

async function updateStatus(row: SubscriptionInquiry, status: InquiryStatus) {
  if (row.status === status) return
  updatingId.value = row.id
  try {
    await $fetch(`/api/admin/subscribe-inquiries/${row.id}`, {
      method: 'PATCH',
      body: { status },
    })
    row.status = status
    if (selectedInquiry.value?.id === row.id) {
      selectedInquiry.value = { ...selectedInquiry.value, status }
    }
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'อัปเดตสถานะไม่สำเร็จ')
  }
  finally {
    updatingId.value = null
  }
}

function onDetailStatus(status: InquiryStatus) {
  const row = selectedInquiry.value
  if (!row) return
  updateStatus(row, status)
}

const exportingCsv = ref(false)
const exportingPdf = ref(false)

const exportBusy = computed(() => exportingCsv.value || exportingPdf.value)

const exportFilterLabel = computed(() => {
  const status = statusFilters.find(f => f.value === statusFilter.value)?.label ?? 'ทั้งหมด'
  const q = search.value.trim()
  return q ? `${status} · ค้นหา "${q}"` : status
})

function ensureExportList(): SubscriptionInquiry[] | null {
  if (pending.value) return null
  const list = filtered.value
  if (!list.length) {
    alert('ไม่มีรายการในตัวกรองปัจจุบัน — ลองเลือก «ทั้งหมด» หรือล้างคำค้นหา')
    return null
  }
  return list
}

function exportInquiriesCsv() {
  const list = ensureExportList()
  if (!list) return

  exportingCsv.value = true
  try {
    const stamp = exportFilenameStamp('subscribe-inquiries')
    downloadCsv(stamp, [
      [...INQUIRY_EXPORT_HEADERS],
      ...buildInquirySummaryExportRows(list),
    ])
    // เบราว์เซอร์มักบล็อกดาวน์โหลด 2 ไฟล์พร้อมกัน — หน่วงไฟล์ที่สอง
    window.setTimeout(() => {
      downloadCsv(`${stamp}-items`, [
        [...INQUIRY_ITEM_EXPORT_HEADERS],
        ...buildInquiryItemExportRows(list),
      ])
    }, 500)
  }
  catch (err) {
    console.error(err)
    alert('ส่งออก CSV ไม่สำเร็จ — ลองรีเฟรชหน้าแล้วกดอีกครั้ง')
  }
  finally {
    window.setTimeout(() => { exportingCsv.value = false }, 600)
  }
}

async function exportInquiriesExcel() {
  const list = ensureExportList()
  if (!list) return

  exportingExcel.value = true
  try {
    await downloadExcelWorkbook(exportFilenameStamp('subscribe-inquiries'), [
      {
        name: 'สรุปต่อคำขอ',
        rows: [
          [...INQUIRY_EXPORT_HEADERS],
          ...buildInquirySummaryExportRows(list),
        ],
      },
      {
        name: 'รายละเอียด รหัสสินค้า',
        rows: [
          [...INQUIRY_ITEM_EXPORT_HEADERS],
          ...buildInquiryItemExportRows(list),
        ],
      },
    ])
  }
  catch (err) {
    console.error(err)
    alert('ส่งออก Excel ไม่สำเร็จ — ลองรีเฟรชหน้าแล้วกดอีกครั้ง')
  }
  finally {
    exportingExcel.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="คำขอสนใจผ่อน"
      description="รายการจากหน้าร้าน (guest หรือลูกค้า login) — ส่งออกตามรายการที่แสดงด้านล่าง"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          :disabled="pending"
          @click="refresh()"
        >
          <Icon
            name="heroicons:arrow-path"
            class="h-4 w-4"
            :class="pending ? 'animate-spin' : ''"
          />
          รีเฟรช
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <button
        v-for="card in statCards"
        :key="card.key"
        type="button"
        class="rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md"
        :class="[
          card.cardClass,
          statusFilter === card.key ? 'ring-2 ring-red-500/30 ring-offset-2' : '',
        ]"
        @click="setStatusFilter(card.key)"
      >
        <div class="flex items-start justify-between gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            :class="card.iconWrap"
          >
            <Icon :name="card.icon" class="h-5 w-5" />
          </div>
          <p class="text-2xl font-bold tabular-nums" :class="card.valueClass">
            {{ card.value }}
          </p>
        </div>
        <p class="mt-3 text-sm font-semibold text-gray-900">{{ card.label }}</p>
        <p class="text-xs text-gray-500">{{ card.hint }}</p>
      </button>
    </div>

    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div class="border-b border-gray-100 bg-gradient-to-r from-gray-50/90 to-white px-4 py-4 sm:px-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="f in statusFilters"
              :key="f.value"
              type="button"
              class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
              :class="statusFilter === f.value
                ? 'bg-[#ea1917] text-white shadow-sm'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'"
              @click="setStatusFilter(f.value)"
            >
              {{ f.label }}
            </button>
          </div>
          <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-2xl lg:flex-1 lg:justify-end">
            <div class="relative min-w-0 flex-1 sm:max-w-md">
              <Icon
                name="heroicons:magnifying-glass"
                class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="search"
                type="search"
                placeholder="ค้นหาชื่อ เบอร์ บริษัท หรือสินค้า..."
                class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
              >
            </div>
            <div class="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                :disabled="pending || exportBusy"
                @click="exportInquiriesCsv"
              >
                <Icon
                  :name="exportingCsv ? 'heroicons:arrow-path' : 'heroicons:arrow-down-tray'"
                  class="h-4 w-4 shrink-0"
                  :class="{ 'animate-spin': exportingCsv }"
                />
                CSV
              </button>
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                :disabled="pending || exportBusy"
                @click="exportInquiriesExcel"
              >
                <Icon
                  :name="exportingExcel ? 'heroicons:arrow-path' : 'heroicons:table-cells'"
                  class="h-4 w-4 shrink-0"
                  :class="{ 'animate-spin': exportingExcel }"
                />
                Excel
              </button>
            </div>
          </div>
        </div>
        <p class="mt-3 text-xs text-gray-500">
          แสดง <span class="font-semibold text-gray-700">{{ filtered.length }}</span>
          จาก {{ stats.total }} รายการ
          <span v-if="filtered.length" class="text-gray-400">· Excel = 2 ชีตในไฟล์เดียว · CSV = 2 ไฟล์</span>
        </p>
      </div>

      <div
        v-if="fetchError"
        class="mx-4 my-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 sm:mx-6"
      >
        <p class="font-medium">โหลดคำขอไม่สำเร็จ</p>
        <p class="mt-1 text-xs opacity-90">
          {{ fetchError.message || 'ตรวจ migration 0022 / 0031' }}
        </p>
      </div>

      <div v-if="pending" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <Icon name="heroicons:arrow-path" class="mb-3 h-8 w-8 animate-spin" />
        <p class="text-sm">กำลังโหลดคำขอ...</p>
      </div>

      <div
        v-else-if="!filtered.length"
        class="flex flex-col items-center justify-center px-6 py-20 text-center"
      >
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
          <Icon name="heroicons:chat-bubble-left-right" class="h-7 w-7" />
        </div>
        <p class="mt-4 text-sm font-medium text-gray-700">ยังไม่มีคำขอในหมวดนี้</p>
        <p class="mt-1 max-w-sm text-xs text-gray-500">
          คำขอจากหน้า “สนใจผ่อน” จะแสดงที่นี่ พร้อมข้อมูล Combo ถ้าลูกค้าเลือกส่วนลด
        </p>
      </div>

      <ul v-else class="divide-y divide-gray-100">
        <li
          v-for="row in filtered"
          :key="row.id"
          class="border-l-4 bg-white transition hover:bg-gray-50/60"
          :class="statusAccentClass(row.status)"
        >
          <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div class="flex min-w-0 flex-1 gap-4">
              <div
                class="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:flex"
                :class="row.status === 'new'
                  ? 'bg-sky-100 text-sky-600'
                  : row.status === 'contacted'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-500'"
              >
                <Icon name="heroicons:user" class="h-6 w-6" />
              </div>

              <div class="min-w-0 flex-1 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="truncate text-base font-semibold text-gray-900">
                    {{ row.contact_name }}
                  </h3>
                  <span
                    class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset"
                    :class="statusClass(row.status)"
                  >
                    {{ statusLabel(row.status) }}
                  </span>
                </div>
                <p
                  v-if="contactSubtitle(row)"
                  class="truncate text-xs text-gray-600"
                >
                  {{ contactSubtitle(row) }}
                </p>
                <p
                  v-if="row.contact_profile?.preferred_contact_time"
                  class="text-xs text-gray-500"
                >
                  ติดต่อกลับ: {{ row.contact_profile.preferred_contact_time }}
                </p>

                <div class="flex flex-wrap items-center gap-2 text-xs">
                  <span class="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
                    {{ applicantLabel(row) }}
                  </span>
                  <span
                    v-if="row.inquiry_source === 'corporate'"
                    class="rounded-md bg-violet-50 px-2 py-0.5 font-medium text-violet-700"
                  >
                    {{ inquirySourceLabel(row.inquiry_source) }}
                  </span>
                  <span
                    v-if="row.customer_id"
                    class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700"
                  >
                    <Icon name="heroicons:check-circle" class="h-3.5 w-3.5" />
                    login
                  </span>
                  <span class="text-gray-500">{{ row.contact_phone }}</span>
                </div>

                <div class="flex flex-wrap items-start gap-3">
                  <p
                    v-if="!(row.items?.length)"
                    class="rounded-xl border border-dashed border-violet-200 bg-violet-50/60 px-3 py-2 text-xs text-violet-800"
                  >
                    ฟอร์มลูกค้าองค์กร — ยังไม่มีรายการสินค้า
                  </p>
                  <div
                    v-for="item in (row.items ?? []).slice(0, 3)"
                    :key="item.product_id"
                    class="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-2.5 py-2 sm:max-w-[14rem]"
                  >
                    <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white bg-white shadow-sm">
                      <img
                        v-if="item.image_url"
                        :src="item.image_url"
                        :alt="item.name"
                        class="h-full w-full object-contain"
                      >
                      <div
                        v-else
                        class="flex h-full w-full items-center justify-center text-gray-300"
                      >
                        <Icon name="heroicons:tv" class="h-5 w-5" />
                      </div>
                    </div>
                    <div class="min-w-0">
                      <p class="line-clamp-2 text-xs font-medium leading-snug text-gray-800">
                        {{ item.name }}
                      </p>
                      <p class="mt-0.5 font-mono text-[10px] text-gray-400">{{ item.sku }}</p>
                    </div>
                  </div>
                  <p
                    v-if="(row.items?.length ?? 0) > 3"
                    class="self-center text-xs text-gray-500"
                  >
                    +{{ (row.items?.length ?? 0) - 3 }} รายการ
                  </p>
                </div>
              </div>
            </div>

            <div class="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
              <div class="flex flex-col items-start gap-1.5 sm:items-end">
                <template v-if="comboSummary(row)">
                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 py-1 text-[11px] font-semibold text-amber-950 ring-1 ring-amber-200/70"
                  >
                    <Icon name="heroicons:sparkles" class="h-3.5 w-3.5 text-amber-600" />
                    {{ comboSummary(row)!.segmentLabel }}
                    <template v-if="comboSummary(row)!.hasDiscount">
                      · ลด {{ comboSummary(row)!.percent }}%
                    </template>
                  </span>
                </template>
                <span
                  v-else
                  class="text-[11px] text-gray-400"
                >
                  ไม่มี Combo
                </span>

                <div class="text-right text-xs text-gray-500">
                  <p class="font-medium text-gray-700">{{ formatRelativeTime(row.created_at) }}</p>
                  <p class="mt-0.5 text-[10px]">{{ formatDate(row.created_at) }}</p>
                </div>
              </div>

              <button
                type="button"
                class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#ea1917] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                @click="openDetail(row)"
              >
                <Icon name="heroicons:eye" class="h-4 w-4" />
                ดูรายละเอียด
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <AdminInquiryDetailModal
      v-model:open="detailOpen"
      :inquiry="selectedInquiry"
      :updating="selectedInquiry ? updatingId === selectedInquiry.id : false"
      @update:status="onDetailStatus"
    />
  </div>
</template>
