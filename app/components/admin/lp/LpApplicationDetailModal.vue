<script setup lang="ts">
import type { LpApplication, LpApplicationStatus } from '~~/shared/types/lpApplication'
import {
  LP_AWARENESS_LABELS,
  LP_EMPLOYMENT_TYPE_LABELS,
  LP_INCOME_LABELS,
  LP_SALES_EXPERIENCE_LABELS,
  LP_STATUS_LABELS,
  LP_WORK_MODE_LABELS,
  lpApplicantDisplayName,
} from '~~/shared/utils/lpApplicationDisplay'
import { buildLpApplicationLineSummary } from '~~/shared/utils/lpApplicationLineSummary'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  application: LpApplication | null
  updating?: boolean
}>()

const emit = defineEmits<{
  'update:status': [status: LpApplicationStatus]
}>()

const copied = ref(false)
const localStatus = ref<LpApplicationStatus>('new')

watch(() => props.application, (row) => {
  if (row) localStatus.value = row.status
}, { immediate: true })

const lineSummary = computed(() => {
  const row = props.application
  if (!row) return ''
  return buildLpApplicationLineSummary({
    first_name: row.first_name,
    last_name: row.last_name,
    contact_phone: row.contact_phone,
    email: row.email,
    line_id: row.line_id,
    province: row.province,
    preferred_contact_time: row.preferred_contact_time,
    questionnaire: row.questionnaire,
  })
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

async function copySummary() {
  if (!lineSummary.value) return
  try {
    await navigator.clipboard.writeText(lineSummary.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch { /* ignore */ }
}

function saveStatus() {
  if (!props.application || localStatus.value === props.application.status) return
  emit('update:status', localStatus.value)
}
</script>

<template>
  <AdminModal
    v-model="open"
    :title="application ? `ใบสมัคร LP #${application.id.slice(0, 8)}` : 'รายละเอียดใบสมัคร'"
    size="lg"
  >
    <template v-if="application">
      <div class="space-y-6">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span
            class="rounded-full px-2.5 py-1 text-xs font-medium"
            :class="application.status === 'new'
              ? 'bg-sky-50 text-sky-700'
              : application.status === 'contacted'
                ? 'bg-amber-50 text-amber-800'
                : 'bg-gray-100 text-gray-600'"
          >
            {{ LP_STATUS_LABELS[application.status] }}
          </span>
          <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-800">
            Lifestyle Planner
          </span>
          <span class="text-xs text-gray-500">ส่งเมื่อ {{ formatDate(application.created_at) }}</span>
        </div>

        <section>
          <h4 class="mb-3 text-sm font-semibold text-gray-900">
            ข้อมูลผู้สมัคร
          </h4>
          <dl class="grid gap-2 rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm sm:grid-cols-2">
            <div class="sm:col-span-2">
              <dt class="text-gray-500">ชื่อ-นามสกุล</dt>
              <dd class="font-medium text-gray-900">
                {{ lpApplicantDisplayName(application.first_name, application.last_name) }}
              </dd>
            </div>
            <div>
              <dt class="text-gray-500">เบอร์โทร</dt>
              <dd class="text-gray-900">{{ application.contact_phone }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Email</dt>
              <dd class="break-all text-gray-900">{{ application.email }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Line ID</dt>
              <dd class="text-gray-900">{{ application.line_id }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">จังหวัด</dt>
              <dd class="text-gray-900">{{ application.province }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-gray-500">เวลาที่สะดวกให้ติดต่อกลับ</dt>
              <dd class="text-gray-900">{{ application.preferred_contact_time }}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h4 class="mb-3 text-sm font-semibold text-gray-900">
            คำถามเบื้องต้น
          </h4>
          <dl class="space-y-2 rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm">
            <div>
              <dt class="text-gray-500">ประสบการณ์ขาย</dt>
              <dd>{{ LP_SALES_EXPERIENCE_LABELS[application.questionnaire.sales_experience] }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">รูปแบบงาน</dt>
              <dd>{{ LP_WORK_MODE_LABELS[application.questionnaire.work_mode] }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">ประเภทงาน</dt>
              <dd>{{ LP_EMPLOYMENT_TYPE_LABELS[application.questionnaire.employment_type] }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">รู้จัก LG Subscribe</dt>
              <dd>{{ LP_AWARENESS_LABELS[application.questionnaire.lg_subscribe_awareness] }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">เหตุผลที่อยากทำ</dt>
              <dd class="whitespace-pre-wrap text-gray-900">{{ application.questionnaire.motivation }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">รายได้ที่ต้องการ/เดือน</dt>
              <dd>{{ LP_INCOME_LABELS[application.questionnaire.expected_income] }}</dd>
            </div>
          </dl>
        </section>

        <section>
          <div class="mb-2 flex items-center justify-between gap-2">
            <h4 class="text-sm font-semibold text-gray-900">
              สรุปข้อความ
            </h4>
            <button
              type="button"
              class="text-xs font-medium text-[#ea1917] hover:underline"
              @click="copySummary"
            >
              {{ copied ? 'คัดลอกแล้ว' : 'คัดลอก' }}
            </button>
          </div>
          <pre class="max-h-48 overflow-auto rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700">{{ lineSummary }}</pre>
        </section>
      </div>

      <div class="mt-6 flex w-full flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <label class="flex items-center gap-2 text-sm text-gray-700">
          สถานะ
          <select
            v-model="localStatus"
            class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            :disabled="updating"
          >
            <option value="new">ใหม่</option>
            <option value="contacted">ติดต่อแล้ว</option>
            <option value="closed">ปิดแล้ว</option>
          </select>
        </label>
        <button
          type="button"
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          :disabled="updating || localStatus === application.status"
          @click="saveStatus"
        >
          {{ updating ? 'กำลังบันทึก...' : 'บันทึกสถานะ' }}
        </button>
      </div>
    </template>
  </AdminModal>
</template>
