<script setup lang="ts">
import type { InquiryApplicantType, SubscriptionInquiryInput } from '~~/shared/types/inquiry'
import { validateInquiryContactForm } from '~~/shared/utils/inquiryForm'

const emit = defineEmits<{
  submit: [payload: SubscriptionInquiryInput]
}>()

defineProps<{
  submitting?: boolean
  error?: string
}>()

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/15'

const noticeClass =
  'rounded-lg bg-[#ea1917] px-4 py-3.5 text-sm text-white'

const applicantType = ref<InquiryApplicantType>('individual')

const form = reactive({
  first_name: '',
  last_name: '',
  contact_phone: '',
  address_line: '',
  subdistrict: '',
  district: '',
  province: '',
  postal_code: '',
  preferred_contact_time: '',
  company_name: '',
  company_registration: '',
  director_first_name: '',
  director_last_name: '',
  security_code: '',
})

const captchaExpected = ref('')
const localError = ref('')

function refreshCaptcha() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]!
  captchaExpected.value = code
  form.security_code = ''
}

onMounted(() => refreshCaptcha())

function buildPayload(): SubscriptionInquiryInput {
  return {
    applicant_type: applicantType.value,
    first_name: form.first_name,
    last_name: form.last_name,
    contact_phone: form.contact_phone,
    address_line: form.address_line,
    subdistrict: form.subdistrict,
    district: form.district,
    province: form.province,
    postal_code: form.postal_code,
    preferred_contact_time: form.preferred_contact_time || undefined,
    company_name: applicantType.value === 'corporate' ? form.company_name : undefined,
    company_registration: applicantType.value === 'corporate' ? form.company_registration : undefined,
    director_first_name: applicantType.value === 'corporate' ? form.director_first_name : undefined,
    director_last_name: applicantType.value === 'corporate' ? form.director_last_name : undefined,
    security_code: form.security_code,
    security_code_expected: captchaExpected.value,
  }
}

function onSubmit() {
  localError.value = ''
  const result = validateInquiryContactForm(buildPayload())
  if (!result.ok) {
    localError.value = result.message
    return
  }
  emit('submit', buildPayload())
}

function setProfileFromName(fullName: string, phone?: string) {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length >= 2) {
    form.first_name = parts[0]!
    form.last_name = parts.slice(1).join(' ')
  }
  else if (parts[0]) {
    form.first_name = parts[0]!
  }
  if (phone) form.contact_phone = phone
}

defineExpose({ setProfileFromName })
</script>

<template>
  <form class="space-y-5" @submit.prevent="onSubmit">
    <div>
      <p class="text-sm font-medium text-gray-800">
        กรุณากรอกข้อมูลเบื้องต้น เพื่อให้แอดมินติดต่อกลับ
      </p>
      <div class="mt-3 flex flex-wrap gap-4">
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-800">
          <input
            v-model="applicantType"
            type="radio"
            class="h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"
            value="individual"
          >
          บุคคลธรรมดา
        </label>
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-800">
          <input
            v-model="applicantType"
            type="radio"
            class="h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"
            value="corporate"
          >
          นิติบุคคล (บริษัท)
        </label>
      </div>
      <hr class="mt-4 border-gray-200">
    </div>

    <div v-if="applicantType === 'individual'" :class="noticeClass">
      <p class="font-semibold">
        การสมัคร LG Subscribe สำหรับบุคคลธรรมดา:
      </p>
      <ul class="mt-2.5 list-disc space-y-1.5 pl-5 text-white/95">
        <li>
          ตัดชำระรายเดือนผ่าน <strong>บัตรเครดิต</strong> เท่านั้น
          <span class="text-white/80">(กรณีหักบัญชีหรือบัตรเดบิตให้ติดต่อทีมขายทางไลน์ก่อน)</span>
        </li>
        <li>เป็นบัตรเครดิตของธนาคารในประเทศไทย</li>
        <li>บัตรเครดิตมีอายุคงเหลืออย่างน้อย <strong>3 เดือน</strong> ก่อนหมดอายุ</li>
        <li>
          <strong>ไม่รองรับ:</strong> บัตรกดเงินสด บัตรวงเงินสินเชื่อ และ บัตรผ่อนสินค้า
          <span class="text-white/80">(สามารถสอบถามทีมขายเพิ่มเติมได้ก่อนทำรายการ)</span>
        </li>
      </ul>
      <p class="mt-3 text-xs leading-relaxed text-white/90">
        การส่งข้อมูลในแบบฟอร์มนี้ เป็นเพียงการให้ข้อมูลเบื้องต้น เพื่อให้เจ้าหน้าที่ประสานงานกลับในการยืนยันการทำรายการ
        โดยยังไม่มีการเรียกเก็บค่าบริการใดๆ และยังไม่ถือเป็นภาระผูกพันทางสัญญาการให้บริการแต่อย่างใด
        จนกว่าจะทำรายการและติดตั้งสำเร็จสมบูรณ์
      </p>
    </div>

    <div v-else :class="noticeClass">
      <p class="font-semibold">
        การสมัคร LG Subscribe สำหรับนิติบุคคล:
      </p>
      <p class="mt-2 text-white/95">
        เลือกการตัดชำระรายเดือนผ่าน <strong>บัตรเครดิตของกรรมการ</strong> หรือ <strong>การวางบิลเก็บเงิน</strong>ได้
        <span class="text-white/80">(งดรับเช็ค)</span>
      </p>
      <ol class="mt-2.5 list-decimal space-y-1.5 pl-5 text-white/95">
        <li>บริษัทฯดังกล่าว ประกอบกิจการมามากกว่า 2 ปี</li>
        <li>บริษัทฯมีผลประกอบการเป็นกำไรติดต่อกันมากกว่า 2 ปีขึ้นไป</li>
        <li>
          จำนวนเครื่องฯที่ได้รับการอนุมัติ หรือไม่ผ่านการอนุมัติ
          ให้การพิจารณาของ LG ถือเป็นที่สิ้นสุด
        </li>
      </ol>
      <p class="mt-3 font-medium">ในกรณีที่ Subscribe ด้วยบัตรเครดิตของกรรมการ :</p>
      <ul class="mt-1.5 list-disc space-y-1.5 pl-5 text-white/95">
        <li>เป็นบัตรเครดิตของธนาคารในประเทศไทย</li>
        <li>บัตรเครดิตมีอายุคงเหลืออย่างน้อย <strong>3 เดือน</strong> ก่อนหมดอายุ</li>
        <li>
          <strong>ไม่รองรับ:</strong> บัตรกดเงินสด บัตรวงเงินสินเชื่อ และ บัตรผ่อนสินค้า
          <span class="text-white/80">(สามารถสอบถามทีมขายเพิ่มเติมได้ก่อนทำรายการ)</span>
        </li>
      </ul>
      <p class="mt-3 text-xs leading-relaxed text-white/90">
        การส่งข้อมูลในแบบฟอร์มนี้ เป็นเพียงการให้ข้อมูลเบื้องต้น เพื่อให้เจ้าหน้าที่ประสานงานกลับในการยืนยันการทำรายการ
        โดยยังไม่มีการเรียกเก็บค่าบริการใดๆ และยังไม่ถือเป็นภาระผูกพันทางสัญญาการให้บริการแต่อย่างใด
        จนกว่าจะทำรายการและติดตั้งสำเร็จสมบูรณ์
      </p>
    </div>

    <h3 class="text-base font-semibold text-gray-900">
      ข้อมูลที่เราต้องการ
    </h3>

    <div
      v-if="applicantType === 'corporate'"
      class="space-y-4 rounded-lg border border-gray-200 bg-gray-50/80 p-4"
    >
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อบริษัท *</label>
        <input
          v-model="form.company_name"
          type="text"
          required
          :class="inputClass"
          placeholder="ระบุชื่อบริษัท"
        >
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">
          เลขที่จดทะเบียนบริษัท (13 หลัก) *
        </label>
        <input
          v-model="form.company_registration"
          type="text"
          inputmode="numeric"
          maxlength="13"
          required
          :class="inputClass"
          placeholder="0000000000000"
        >
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อกรรมการผู้มีอำนาจ *</label>
          <input
            v-model="form.director_first_name"
            type="text"
            required
            :class="inputClass"
            placeholder="ระบุชื่อภาษาไทย"
          >
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">นามสกุลกรรมการผู้มีอำนาจ *</label>
          <input
            v-model="form.director_last_name"
            type="text"
            required
            :class="inputClass"
            placeholder="ระบุนามสกุลภาษาไทย"
          >
        </div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">
          {{ applicantType === 'corporate' ? 'ชื่อผู้ติดต่อ (ภาษาไทย) *' : 'ชื่อ (ภาษาไทย) *' }}
        </label>
        <input
          v-model="form.first_name"
          type="text"
          required
          :class="inputClass"
          placeholder="ระบุชื่อภาษาไทย"
        >
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">นามสกุล (ภาษาไทย) *</label>
        <input
          v-model="form.last_name"
          type="text"
          required
          :class="inputClass"
          placeholder="ระบุนามสกุลภาษาไทย"
        >
      </div>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-gray-700">เบอร์โทรศัพท์ติดต่อ *</label>
      <input
        v-model="form.contact_phone"
        type="tel"
        required
        :class="inputClass"
        placeholder="เช่น 0812345678"
      >
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-gray-700">
        {{
          applicantType === 'corporate'
            ? 'ที่อยู่ติดตั้ง (บ้านเลขที่, ชั้น, หมู่, ซอย, ถนน) *'
            : 'ที่อยู่ (บ้านเลขที่, ชั้น, หมู่, ซอย, ถนน) *'
        }}
      </label>
      <input
        v-model="form.address_line"
        type="text"
        required
        :class="inputClass"
        placeholder="เช่น 123/45 ซ.สุขุมวิท 1 ถนนสุขุมวิท"
      >
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">ตำบล/แขวง *</label>
        <input v-model="form.subdistrict" type="text" required :class="inputClass">
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">อำเภอ/เขต *</label>
        <input v-model="form.district" type="text" required :class="inputClass">
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">จังหวัด *</label>
        <input v-model="form.province" type="text" required :class="inputClass">
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">รหัสไปรษณีย์ *</label>
        <input
          v-model="form.postal_code"
          type="text"
          inputmode="numeric"
          maxlength="5"
          required
          :class="inputClass"
          placeholder="10110"
        >
      </div>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-gray-700">เวลาที่สะดวกให้ติดต่อกลับ</label>
      <input
        v-model="form.preferred_contact_time"
        type="text"
        :class="inputClass"
        placeholder="เช่น จันทร์–ศุกร์ 10:00–17:00"
      >
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

    <p v-if="localError || error" class="text-sm text-red-600">{{ localError || error }}</p>

    <button
      type="submit"
      class="w-full rounded-full bg-[#ea1917] py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      :disabled="submitting"
    >
      {{ submitting ? 'กำลังส่ง...' : 'ส่งคำขอสนใจผ่อน' }}
    </button>
  </form>
</template>
