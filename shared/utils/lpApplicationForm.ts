import type { LpApplicationInput, LpQuestionnaire } from '~~/shared/types/lpApplication'
import { isThaiName, isValidThaiPhone, normalizePhone } from '~~/shared/utils/inquiryForm'
import { isPreferredContactTimeOption } from '~~/shared/utils/preferredContactTime'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SALES = new Set(['yes', 'no'])
const WORK_MODE = new Set(['offline', 'online'])
const EMPLOYMENT = new Set(['part_time', 'full_time'])
const AWARENESS = new Set(['know', 'unknown', 'customer'])
const INCOME = new Set([
  '20000_30000',
  '30001_50000',
  '50001_100000',
  '100001_plus',
])

export type LpFormValidationResult =
  | {
    ok: true
    data: {
      first_name: string
      last_name: string
      contact_phone: string
      email: string
      line_id: string
      province: string
      preferred_contact_time: string
      questionnaire: LpQuestionnaire
    }
  }
  | { ok: false, message: string }

export function validateLpApplicationForm(input: LpApplicationInput): LpFormValidationResult {
  const first_name = input.first_name?.trim() ?? ''
  const last_name = input.last_name?.trim() ?? ''
  const contact_phone = normalizePhone(input.contact_phone?.trim() ?? '')
  const email = input.email?.trim() ?? ''
  const line_id = input.line_id?.trim() ?? ''
  const province = input.province?.trim() ?? ''
  const preferred_contact_time = input.preferred_contact_time?.trim() ?? ''
  const motivation = input.motivation?.trim() ?? ''

  if (!isThaiName(first_name)) {
    return { ok: false, message: 'กรุณากรอกชื่อเป็นภาษาไทย' }
  }
  if (!isThaiName(last_name)) {
    return { ok: false, message: 'กรุณากรอกนามสกุลเป็นภาษาไทย' }
  }
  if (!isValidThaiPhone(contact_phone)) {
    return { ok: false, message: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง' }
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, message: 'กรุณากรอกอีเมลให้ถูกต้อง' }
  }
  if (!line_id) {
    return { ok: false, message: 'กรุณากรอก Line ID' }
  }
  if (!province) {
    return { ok: false, message: 'กรุณากรอกจังหวัด' }
  }
  if (!preferred_contact_time || !isPreferredContactTimeOption(preferred_contact_time)) {
    return { ok: false, message: 'กรุณาเลือกเวลาที่สะดวกให้ติดต่อกลับ' }
  }
  if (!SALES.has(input.sales_experience)) {
    return { ok: false, message: 'กรุณาเลือกประสบการณ์การทำงานขาย' }
  }
  if (!WORK_MODE.has(input.work_mode)) {
    return { ok: false, message: 'กรุณาเลือกรูปแบบการทำงาน' }
  }
  if (!EMPLOYMENT.has(input.employment_type)) {
    return { ok: false, message: 'กรุณาเลือกประเภทการทำงาน' }
  }
  if (!AWARENESS.has(input.lg_subscribe_awareness)) {
    return { ok: false, message: 'กรุณาเลือกว่ารู้จัก LG Subscribe หรือไม่' }
  }
  if (!motivation) {
    return { ok: false, message: 'กรุณาอธิบายว่าทำไมถึงอยากทำ LG Subscribe' }
  }
  if (!INCOME.has(input.expected_income)) {
    return { ok: false, message: 'กรุณาเลือกรายได้ที่ต้องการ' }
  }

  const expected = input.security_code_expected?.trim().toLowerCase() ?? ''
  const given = input.security_code?.trim().toLowerCase() ?? ''
  if (!expected || given !== expected) {
    return { ok: false, message: 'รหัสความปลอดภัยไม่ถูกต้อง' }
  }

  const questionnaire: LpQuestionnaire = {
    sales_experience: input.sales_experience,
    work_mode: input.work_mode,
    employment_type: input.employment_type,
    lg_subscribe_awareness: input.lg_subscribe_awareness,
    motivation,
    expected_income: input.expected_income,
  }

  return {
    ok: true,
    data: {
      first_name,
      last_name,
      contact_phone,
      email,
      line_id,
      province,
      preferred_contact_time,
      questionnaire,
    },
  }
}
