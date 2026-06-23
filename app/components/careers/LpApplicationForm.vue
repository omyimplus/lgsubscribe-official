<script setup lang="ts">
import type { LpApplicationInput } from '~~/shared/types/lpApplication'
import { validateLpApplicationForm } from '~~/shared/utils/lpApplicationForm'
import { PREFERRED_CONTACT_TIME_OPTIONS } from '~~/shared/utils/preferredContactTime'

const emit = defineEmits<{
  submit: [payload: LpApplicationInput]
}>()

defineProps<{
  submitting?: boolean
  error?: string
}>()

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/15'

const radioClass = 'h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500'

const form = reactive({
  first_name: '',
  last_name: '',
  contact_phone: '',
  email: '',
  line_id: '',
  province: '',
  preferred_contact_time: '',
  sales_experience: '' as '' | 'yes' | 'no',
  work_mode: '' as '' | 'offline' | 'online',
  employment_type: '' as '' | 'part_time' | 'full_time',
  lg_subscribe_awareness: '' as '' | 'know' | 'unknown' | 'customer',
  motivation: '',
  expected_income: '' as '' | '20000_30000' | '30001_50000' | '50001_100000' | '100001_plus',
  security_code: '',
})

const captchaExpected = ref('')
const localError = ref('')

function refreshCaptcha() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]!
  captchaExpected.value = code
  form.security_code = ''
}

onMounted(() => refreshCaptcha())

function buildPayload(): LpApplicationInput {
  return {
    first_name: form.first_name,
    last_name: form.last_name,
    contact_phone: form.contact_phone,
    email: form.email,
    line_id: form.line_id,
    province: form.province,
    preferred_contact_time: form.preferred_contact_time,
    sales_experience: form.sales_experience as LpApplicationInput['sales_experience'],
    work_mode: form.work_mode as LpApplicationInput['work_mode'],
    employment_type: form.employment_type as LpApplicationInput['employment_type'],
    lg_subscribe_awareness: form.lg_subscribe_awareness as LpApplicationInput['lg_subscribe_awareness'],
    motivation: form.motivation,
    expected_income: form.expected_income as LpApplicationInput['expected_income'],
    security_code: form.security_code,
    security_code_expected: captchaExpected.value,
  }
}

function onSubmit() {
  localError.value = ''
  const result = validateLpApplicationForm(buildPayload())
  if (!result.ok) {
    localError.value = result.message
    return
  }
  emit('submit', buildPayload())
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="onSubmit">
    <p class="text-sm font-semibold text-gray-900">
      ข้อมูลที่เราต้องการ
    </p>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อ (ภาษาไทย) *</label>
        <input v-model="form.first_name" type="text" required :class="inputClass">
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">นามสกุล (ภาษาไทย) *</label>
        <input v-model="form.last_name" type="text" required :class="inputClass">
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">เบอร์โทรศัพท์ติดต่อ *</label>
        <input
          v-model="form.contact_phone"
          type="tel"
          inputmode="tel"
          required
          :class="inputClass"
          placeholder="0812345678"
        >
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">Email *</label>
        <input v-model="form.email" type="email" required :class="inputClass">
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">Line ID *</label>
        <input v-model="form.line_id" type="text" required :class="inputClass">
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">จังหวัด *</label>
        <input v-model="form.province" type="text" required :class="inputClass">
      </div>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-gray-700">เวลาที่สะดวกให้ติดต่อกลับ *</label>
      <select
        v-model="form.preferred_contact_time"
        required
        :class="inputClass"
      >
        <option disabled value="">
          เลือกช่วงเวลา
        </option>
        <option
          v-for="slot in PREFERRED_CONTACT_TIME_OPTIONS"
          :key="slot"
          :value="slot"
        >
          {{ slot }}
        </option>
      </select>
    </div>

    <div class="rounded-xl border border-gray-200 bg-gray-50/80 p-5 sm:p-6">
      <p class="mb-5 text-sm font-semibold text-gray-900 sm:mb-6">
        คำถามเบื้องต้น
      </p>

      <div class="flex flex-col gap-6 sm:gap-8">
      <fieldset class="space-y-2.5">
        <legend class="mb-1 text-sm font-medium text-gray-700">
          1. มีประสบการณ์การทำงานขายหรือไม่ *
        </legend>
        <div class="flex flex-wrap gap-4">
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input v-model="form.sales_experience" type="radio" :class="radioClass" value="yes" required>
            เคย
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input v-model="form.sales_experience" type="radio" :class="radioClass" value="no">
            ไม่เคย
          </label>
        </div>
      </fieldset>

      <fieldset class="space-y-2.5">
        <legend class="mb-1 text-sm font-medium text-gray-700">
          2. ประสงค์ทำงานแบบใด *
        </legend>
        <div class="flex flex-wrap gap-4">
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input v-model="form.work_mode" type="radio" :class="radioClass" value="offline" required>
            Offline
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input v-model="form.work_mode" type="radio" :class="radioClass" value="online">
            Online
          </label>
        </div>
      </fieldset>

      <fieldset class="space-y-2.5">
        <legend class="mb-1 text-sm font-medium text-gray-700">
          3. สนใจทำแบบ *
        </legend>
        <div class="flex flex-wrap gap-4">
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input v-model="form.employment_type" type="radio" :class="radioClass" value="part_time" required>
            Part time
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input v-model="form.employment_type" type="radio" :class="radioClass" value="full_time">
            Full time
          </label>
        </div>
      </fieldset>

      <fieldset class="space-y-2.5">
        <legend class="mb-1 text-sm font-medium text-gray-700">
          4. รู้จัก LG Subscribe หรือไม่ *
        </legend>
        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input v-model="form.lg_subscribe_awareness" type="radio" :class="radioClass" value="know" required>
            รู้จัก
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input v-model="form.lg_subscribe_awareness" type="radio" :class="radioClass" value="unknown">
            ไม่รู้จัก
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input v-model="form.lg_subscribe_awareness" type="radio" :class="radioClass" value="customer">
            เป็นลูกค้า Subscribe
          </label>
        </div>
      </fieldset>

      <div class="space-y-2.5">
        <label class="block text-sm font-medium text-gray-700">
          5. ทำไมถึงอยากทำ LG Subscribe *
        </label>
        <textarea
          v-model="form.motivation"
          rows="4"
          required
          :class="inputClass"
          placeholder="อธิบายเหตุผลและแรงจูงใจของคุณ"
        />
      </div>

      <fieldset class="space-y-2.5">
        <legend class="mb-1 text-sm font-medium text-gray-700">
          6. อยากได้รายได้เดือนละเท่าไร *
        </legend>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">
            <input v-model="form.expected_income" type="radio" :class="radioClass" value="20000_30000" required>
            20,000-30,000
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">
            <input v-model="form.expected_income" type="radio" :class="radioClass" value="30001_50000">
            30,001-50,000
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">
            <input v-model="form.expected_income" type="radio" :class="radioClass" value="50001_100000">
            50,001-100,000
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">
            <input v-model="form.expected_income" type="radio" :class="radioClass" value="100001_plus">
            100,001 ขึ้นไป
          </label>
        </div>
      </fieldset>
      </div>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-gray-700">
        รหัสความปลอดภัย (ตัวพิมพ์เล็ก/ใหญ่ได้) *
      </label>
      <div class="flex flex-wrap items-center gap-3">
        <div
          class="flex h-11 min-w-[7rem] items-center justify-center rounded-lg border border-gray-300 bg-gray-100 px-4 font-mono text-lg font-bold tracking-widest text-gray-800 select-none"
          aria-hidden="true"
        >
          {{ captchaExpected }}
        </div>
        <button
          type="button"
          class="text-xs font-medium text-gray-600 underline hover:text-gray-900"
          @click="refreshCaptcha"
        >
          เปลี่ยนรหัส
        </button>
        <input
          v-model="form.security_code"
          type="text"
          required
          autocomplete="off"
          :class="[inputClass, 'max-w-[12rem] flex-1']"
          placeholder="พิมพ์ตามด้านซ้าย"
        >
      </div>
    </div>

    <p v-if="localError || error" class="text-sm text-red-600">
      {{ localError || error }}
    </p>

    <button
      type="submit"
      class="w-full rounded-full bg-[#ea1917] py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      :disabled="submitting"
    >
      {{ submitting ? 'กำลังส่ง...' : 'ส่งใบสมัคร LP' }}
    </button>
  </form>
</template>
