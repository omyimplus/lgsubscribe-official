<script setup lang="ts">
import type { CartPdfEmailLead, CartPdfEmailLeadsAdminResponse } from '~~/shared/types/cartPdfEmailLead'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data, pending, error: fetchError, refresh } = await useFetch<CartPdfEmailLeadsAdminResponse>(
  '/api/admin/cart-pdf-email-leads',
  { default: () => ({ leads: [], smtp: { configured: false, host: '', from: '' } }) },
)

const search = ref('')
const copied = ref(false)

const leads = computed(() => data.value?.leads ?? [])
const smtp = computed(() => data.value?.smtp ?? { configured: false, host: '', from: '' })

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return leads.value
  return leads.value.filter(row => row.email.includes(q))
})

const stats = computed(() => ({
  total: leads.value.length,
  sent: leads.value.filter(row => row.last_email_sent_at).length,
  repeat: leads.value.filter(row => row.request_count > 1).length,
}))

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

async function copyEmails() {
  const text = filtered.value.map(row => row.email).join('\n')
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch {
    alert('คัดลอกไม่สำเร็จ')
  }
}

function downloadCsv() {
  const rows = filtered.value
  if (!rows.length) return
  const header = 'email,first_requested_at,last_requested_at,request_count,last_email_sent_at'
  const lines = rows.map(row => [
    row.email,
    row.first_requested_at,
    row.last_requested_at,
    row.request_count,
    row.last_email_sent_at ?? '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const blob = new Blob([`\uFEFF${header}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cart-pdf-emails-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="อีเมล PDF ตารางผ่อน"
      description="รายการอีเมลจากลูกค้าที่ขอรับ PDF ตารางผ่อน — เก็บไม่ซ้ำ ใช้สำหรับการตลาด"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          :disabled="!filtered.length"
          @click="copyEmails"
        >
          <Icon name="heroicons:clipboard-document" class="h-4 w-4" />
          {{ copied ? 'คัดลอกแล้ว' : 'คัดลอกอีเมล' }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          :disabled="!filtered.length"
          @click="downloadCsv"
        >
          <Icon name="heroicons:arrow-down-tray" class="h-4 w-4" />
          ดาวน์โหลด CSV
        </button>
      </template>
    </AdminPageHeader>

    <div
      class="rounded-xl border p-4"
      :class="smtp.configured
        ? 'border-emerald-200 bg-emerald-50/60'
        : 'border-amber-200 bg-amber-50/60'"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-gray-900">
            ระบบส่งอีเมล
            <span
              class="ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
              :class="smtp.configured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-900'"
            >
              {{ smtp.configured ? 'พร้อมใช้งาน' : 'ยังไม่ได้ตั้งค่า' }}
            </span>
          </p>
          <p v-if="smtp.configured" class="mt-1 text-xs text-gray-600">
            From: {{ smtp.from || '—' }}
            <span v-if="smtp.host"> · SMTP Host: {{ smtp.host }}</span>
          </p>
          <p v-else class="mt-1 text-xs text-amber-900">
            ตั้งค่า ThaiBulkSMS Email หรือ SMTP ใน <code class="rounded bg-white/80 px-1">.env</code> แล้วรีสตาร์ทเซิร์ฟเวอร์
          </p>
        </div>
      </div>

      <details class="mt-3 text-xs text-gray-700">
        <summary class="cursor-pointer font-medium text-gray-800">
          แนะนำเจ้าบริการอีเมลในประเทศไทย
        </summary>
        <ul class="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
          <li>
            <strong>Amazon SES</strong> (ภูมิภาค Singapore) — ราคาถูก ส่ง transactional ได้เยอะ เหมาะ production
          </li>
          <li>
            <strong>ThaiBulkSMS Email</strong> — ผู้ให้บริการไทย รองรับภาษาไทย มีทีมช่วยตั้งค่า
          </li>
          <li>
            <strong>SendGrid / Brevo</strong> — ตั้ง SMTP ง่าย มีแดชบอร์ดสถิติ
          </li>
          <li>
            <strong>Zoho Mail / Google Workspace</strong> — ใช้อีเมลโดเมนบริษัทส่งผ่าน SMTP (ปริมาณน้อย–กลาง)
          </li>
        </ul>
        <p class="mt-2 text-gray-600">
          ตัวอย่างใน <code class="rounded bg-white/80 px-1">.env.example</code>:
          <code class="mt-1 block rounded bg-white/80 px-2 py-1 text-[11px]">
            NUXT_THAIBULK_EMAIL_API_KEY / NUXT_THAIBULK_EMAIL_API_SECRET / NUXT_THAIBULK_EMAIL_FROM / NUXT_THAIBULK_EMAIL_TEMPLATE_UUID
          </code>
          หรือ SMTP: NUXT_SMTP_HOST / NUXT_SMTP_PORT=587 / NUXT_SMTP_USER / NUXT_SMTP_PASS / NUXT_SMTP_FROM
        </p>
      </details>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <p class="text-xs text-gray-500">อีเมลไม่ซ้ำ</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
        <p class="text-xs text-emerald-700">ส่ง PDF สำเร็จแล้ว</p>
        <p class="text-2xl font-bold text-emerald-800">{{ stats.sent }}</p>
      </div>
      <div class="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
        <p class="text-xs text-sky-700">ขอซ้ำ (อีเมลเดิม)</p>
        <p class="text-2xl font-bold text-sky-800">{{ stats.repeat }}</p>
      </div>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        v-model="search"
        type="search"
        placeholder="ค้นหาอีเมล..."
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:max-w-md"
      >
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        :disabled="pending"
        @click="refresh()"
      >
        รีเฟรช
      </button>
    </div>

    <p v-if="fetchError" class="text-sm text-red-600">
      โหลดข้อมูลไม่สำเร็จ
    </p>

    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th class="px-4 py-3">อีเมล</th>
            <th class="px-4 py-3">ขอครั้งแรก</th>
            <th class="px-4 py-3">ขอล่าสุด</th>
            <th class="px-4 py-3 text-center">จำนวนครั้ง</th>
            <th class="px-4 py-3">ส่ง PDF ล่าสุด</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="pending">
            <td colspan="5" class="px-4 py-8 text-center text-gray-500">กำลังโหลด...</td>
          </tr>
          <tr v-else-if="!filtered.length">
            <td colspan="5" class="px-4 py-8 text-center text-gray-500">ยังไม่มีรายการ</td>
          </tr>
          <tr v-for="row in filtered" :key="row.id" class="hover:bg-gray-50/80">
            <td class="px-4 py-3 font-medium text-gray-900">{{ row.email }}</td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(row.first_requested_at) }}</td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(row.last_requested_at) }}</td>
            <td class="px-4 py-3 text-center">
              <span
                class="inline-flex min-w-[1.75rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="row.request_count > 1 ? 'bg-sky-100 text-sky-800' : 'bg-gray-100 text-gray-700'"
              >
                {{ row.request_count }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(row.last_email_sent_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
