<script setup lang="ts">
import type { InquiryContactProfile, InquiryStatus, SubscriptionInquiry } from '~~/shared/types/inquiry'
import { comboSegmentLabels } from '~~/shared/utils/comboProgramDisplay'
import { formatContactAddress } from '~~/shared/utils/inquiryForm'
import { buildLineSummary } from '~~/shared/utils/inquiryLineSummary'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  inquiry: SubscriptionInquiry | null
  updating?: boolean
}>()

const emit = defineEmits<{
  'update:status': [status: InquiryStatus]
}>()

const copied = ref(false)
const localStatus = ref<InquiryStatus>('new')

watch(() => props.inquiry, (row) => {
  if (row) localStatus.value = row.status
}, { immediate: true })

const profile = computed(() => props.inquiry?.contact_profile ?? null)

const hasStructuredProfile = computed(
  () => Boolean(profile.value?.first_name && profile.value?.address_line),
)

const comboSnapshot = computed(() => props.inquiry?.combo_snapshot ?? null)

const comboQuote = computed(() => comboSnapshot.value?.quote ?? null)

const totalNet = computed(() => {
  const items = props.inquiry?.items ?? []
  const advance = items.reduce((sum, i) => sum + (Number(i.advance_amount) || 0), 0)
  if (comboQuote.value) {
    return comboQuote.value.order_total_charged + advance
  }
  return items.reduce(
    (sum, i) => sum + (i.computed_net_total ?? (i.computed_total ?? 0) + (Number(i.advance_amount) || 0)),
    0,
  )
})

const totalContract = computed(() => {
  if (comboQuote.value) return comboQuote.value.order_total_charged
  return (props.inquiry?.items ?? []).reduce((sum, i) => sum + (i.computed_total ?? 0), 0)
})

const lineSummary = computed(() => {
  const row = props.inquiry
  if (!row) return ''
  return buildLineSummary(
    {
      name: row.contact_name,
      phone: row.contact_phone,
      lineId: row.contact_line_id,
      note: row.contact_note,
      profile: profile.value ?? undefined,
      applicant_type: row.applicant_type,
    },
    row.items ?? [],
    comboSnapshot.value,
  )
})

function applicantLabel(row: SubscriptionInquiry) {
  return (row.applicant_type ?? 'individual') === 'corporate' ? 'นิติบุคคล' : 'บุคคลธรรมดา'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

function statusLabel(s: InquiryStatus) {
  if (s === 'new') return 'ใหม่'
  if (s === 'contacted') return 'ติดต่อแล้ว'
  return 'ปิดแล้ว'
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
  if (!props.inquiry || localStatus.value === props.inquiry.status) return
  emit('update:status', localStatus.value)
}
</script>

<template>
  <AdminModal
    v-model="open"
    :title="inquiry ? `คำขอ #${inquiry.id.slice(0, 8)}` : 'รายละเอียดคำขอ'"
    size="xl"
  >
    <template v-if="inquiry">
      <div class="space-y-6">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span
            class="rounded-full px-2.5 py-1 text-xs font-medium"
            :class="inquiry.status === 'new'
              ? 'bg-sky-50 text-sky-700'
              : inquiry.status === 'contacted'
                ? 'bg-amber-50 text-amber-800'
                : 'bg-gray-100 text-gray-600'"
          >
            {{ statusLabel(inquiry.status) }}
          </span>
          <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
            {{ applicantLabel(inquiry) }}
          </span>
          <span
            v-if="inquiry.combo_customer_segment"
            class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
          >
            Combo: {{ comboSegmentLabels[inquiry.combo_customer_segment] }}
            <template v-if="comboQuote?.percent">
              · {{ comboQuote.percent }}%
            </template>
          </span>
          <span v-if="inquiry.customer_id" class="text-xs text-emerald-600">ลูกค้า login</span>
          <span class="text-xs text-gray-500">ส่งเมื่อ {{ formatDate(inquiry.created_at) }}</span>
        </div>

        <section>
          <h4 class="mb-3 text-sm font-semibold text-gray-900">ข้อมูลติดต่อ</h4>
          <dl
            v-if="hasStructuredProfile && profile"
            class="grid gap-2 rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm sm:grid-cols-2"
          >
            <template v-if="profile.applicant_type === 'corporate'">
              <div class="sm:col-span-2">
                <dt class="text-gray-500">ชื่อบริษัท</dt>
                <dd class="font-medium text-gray-900">{{ profile.company_name }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-gray-500">เลขทะเบียนนิติบุคคล</dt>
                <dd class="font-mono text-gray-900">{{ profile.company_registration }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">ชื่อกรรมการผู้มีอำนาจ</dt>
                <dd class="text-gray-900">{{ profile.director_first_name || '—' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">นามสกุลกรรมการผู้มีอำนาจ</dt>
                <dd class="text-gray-900">{{ profile.director_last_name || '—' }}</dd>
              </div>
            </template>
            <div>
              <dt class="text-gray-500">{{ profile.applicant_type === 'corporate' ? 'ชื่อผู้ติดต่อ' : 'ชื่อ' }}</dt>
              <dd class="text-gray-900">{{ profile.first_name }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">นามสกุล</dt>
              <dd class="text-gray-900">{{ profile.last_name }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">เบอร์โทร</dt>
              <dd class="text-gray-900">{{ profile.contact_phone || inquiry.contact_phone }}</dd>
            </div>
            <div v-if="inquiry.contact_line_id">
              <dt class="text-gray-500">Line ID</dt>
              <dd class="text-gray-900">{{ inquiry.contact_line_id }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-gray-500">
                {{ profile.applicant_type === 'corporate' ? 'ที่อยู่ติดตั้ง' : 'ที่อยู่' }}
              </dt>
              <dd class="text-gray-900">{{ formatContactAddress(profile) }}</dd>
            </div>
            <div v-if="profile.preferred_contact_time" class="sm:col-span-2">
              <dt class="text-gray-500">เวลาที่สะดวกให้ติดต่อกลับ</dt>
              <dd class="text-gray-900">{{ profile.preferred_contact_time }}</dd>
            </div>
          </dl>
          <dl
            v-else
            class="space-y-2 rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm"
          >
            <div>
              <dt class="text-gray-500">ชื่อที่แสดง</dt>
              <dd class="font-medium text-gray-900">{{ inquiry.contact_name }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">เบอร์โทร</dt>
              <dd class="text-gray-900">{{ inquiry.contact_phone }}</dd>
            </div>
            <div v-if="inquiry.contact_line_id">
              <dt class="text-gray-500">Line ID</dt>
              <dd class="text-gray-900">{{ inquiry.contact_line_id }}</dd>
            </div>
          </dl>
          <p v-if="inquiry.contact_note" class="mt-2 text-sm text-gray-600">
            <span class="font-medium text-gray-700">หมายเหตุ:</span> {{ inquiry.contact_note }}
          </p>
        </section>

        <section
          v-if="comboSnapshot"
          class="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4"
        >
          <h4 class="mb-2 text-sm font-semibold text-gray-900">ส่วนลด Combo</h4>
          <p class="text-xs text-gray-600">
            <span class="font-medium">{{ comboSegmentLabels[comboSnapshot.customer_segment] }}</span>
            <template v-if="comboSnapshot.program_name">
              · {{ comboSnapshot.program_name }}
            </template>
            <template v-if="comboQuote?.percent">
              · ลด {{ comboQuote.percent }}% ({{ comboQuote.item_count }} ชิ้น)
            </template>
          </p>
          <ComboInstallmentHighlight
            v-if="comboQuote"
            :quote="comboQuote"
            show-per-item
            class="mt-3"
          />
          <p
            v-else-if="comboQuote && !comboQuote.percent"
            class="mt-2 text-xs text-gray-500"
          >
            ไม่เข้าเงื่อนไขชั้นส่วนลดตามจำนวนชิ้น
          </p>
          <p v-if="comboSnapshot.quoted_at" class="mt-2 text-[10px] text-gray-400">
            คำนวณเมื่อ {{ formatDate(comboSnapshot.quoted_at) }}
          </p>
        </section>

        <section
          v-else-if="inquiry.items?.length"
          class="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-3 text-xs text-gray-500"
        >
          ไม่มีข้อมูล Combo (คำขอก่อนระบบบันทึก snapshot หรือยังไม่รัน migration 0031)
        </section>

        <section>
          <h4 class="mb-3 text-sm font-semibold text-gray-900">
            สินค้าและแผนที่เลือก ({{ inquiry.items?.length ?? 0 }})
          </h4>
          <div v-if="!inquiry.items?.length" class="text-sm text-gray-500">ไม่มีรายการสินค้า</div>
          <div v-else class="space-y-4">
            <div
              v-for="(item, index) in inquiry.items"
              :key="item.plan_id + item.product_id"
              class="rounded-xl border border-gray-200 p-4"
            >
              <p class="mb-3 text-xs font-medium text-gray-500">รายการที่ {{ index + 1 }}</p>
              <InquiryItemDetailBody :item="item" />
            </div>
          </div>
        </section>

        <InterestCostSummary
          v-if="inquiry.items?.length"
          :items="inquiry.items"
          :total-contract="totalContract"
          :total-net="totalNet"
          :combo-quote="comboQuote"
          :show-combo-installment="false"
          :show-contract-toggle="true"
        />

        <section class="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h4 class="text-sm font-semibold text-gray-900">ข้อความสรุป (Line)</h4>
            <button
              type="button"
              class="text-xs font-medium text-red-600 hover:underline"
              @click="copySummary"
            >
              {{ copied ? 'คัดลอกแล้ว' : 'คัดลอก' }}
            </button>
          </div>
          <pre class="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-gray-700">{{ lineSummary }}</pre>
        </section>

        <p class="font-mono text-[10px] text-gray-400">รหัสคำขอ: {{ inquiry.id }}</p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <span class="shrink-0">สถานะ</span>
          <select
            v-model="localStatus"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
            :disabled="updating || !inquiry"
          >
            <option value="new">ใหม่</option>
            <option value="contacted">ติดต่อแล้ว</option>
            <option value="closed">ปิดแล้ว</option>
          </select>
        </label>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="open = false"
          >
            ปิด
          </button>
          <button
            type="button"
            class="rounded-xl bg-[#ea1917] px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            :disabled="updating || !inquiry || localStatus === inquiry?.status"
            @click="saveStatus"
          >
            {{ updating ? 'กำลังบันทึก...' : 'บันทึกสถานะ' }}
          </button>
        </div>
      </div>
    </template>
  </AdminModal>
</template>
