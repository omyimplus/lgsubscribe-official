import type { InquiryApplicantType, InquiryContactProfile } from '~~/shared/types/inquiry'
import { isPreferredContactTimeOption } from '~~/shared/utils/preferredContactTime'

const THAI_NAME_RE = /^[\u0E00-\u0E7F\s.]+$/
const PHONE_RE = /^0\d{8,9}$/
const POSTAL_RE = /^\d{5}$/
const COMPANY_REG_RE = /^\d{13}$/

export function isThaiName(value: string): boolean {
  const t = value.trim()
  return t.length > 0 && THAI_NAME_RE.test(t)
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidThaiPhone(value: string): boolean {
  const digits = normalizePhone(value)
  return PHONE_RE.test(digits)
}

export function formatContactDisplayName(profile: InquiryContactProfile): string {
  if (profile.applicant_type === 'corporate') {
    const person = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
    if (profile.company_name && person) return `${profile.company_name} (${person})`
    return profile.company_name || person || 'นิติบุคคล'
  }
  return [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
}

export function formatContactAddress(profile: InquiryContactProfile): string {
  const parts = [
    profile.address_line,
    profile.subdistrict ? `ต.${profile.subdistrict}` : '',
    profile.district ? `อ.${profile.district}` : '',
    profile.province,
    profile.postal_code,
  ].filter(Boolean)
  return parts.join(' ')
}

export type InquiryFormValidationResult =
  | { ok: true, profile: InquiryContactProfile }
  | { ok: false, message: string }

export function validateInquiryContactForm(input: {
  applicant_type: InquiryApplicantType
  first_name?: string
  last_name?: string
  contact_phone?: string
  address_line?: string
  subdistrict?: string
  district?: string
  province?: string
  postal_code?: string
  company_name?: string
  company_registration?: string
  director_first_name?: string
  director_last_name?: string
  preferred_contact_time?: string
  security_code?: string
  security_code_expected?: string
}): InquiryFormValidationResult {
  const applicant_type = input.applicant_type
  const first_name = input.first_name?.trim() ?? ''
  const last_name = input.last_name?.trim() ?? ''
  const phoneRaw = input.contact_phone?.trim() ?? ''
  const phone = normalizePhone(phoneRaw)

  if (!isThaiName(first_name)) {
    return { ok: false, message: 'กรุณากรอกชื่อเป็นภาษาไทย' }
  }
  if (!isThaiName(last_name)) {
    return { ok: false, message: 'กรุณากรอกนามสกุลเป็นภาษาไทย' }
  }
  if (!isValidThaiPhone(phoneRaw)) {
    return { ok: false, message: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)' }
  }

  const address_line = input.address_line?.trim() ?? ''
  const subdistrict = input.subdistrict?.trim() ?? ''
  const district = input.district?.trim() ?? ''
  const province = input.province?.trim() ?? ''
  const postal_code = input.postal_code?.trim() ?? ''

  if (!address_line) return { ok: false, message: 'กรุณากรอกที่อยู่' }
  if (!subdistrict) return { ok: false, message: 'กรุณากรอกตำบล/แขวง' }
  if (!district) return { ok: false, message: 'กรุณากรอกอำเภอ/เขต' }
  if (!province) return { ok: false, message: 'กรุณากรอกจังหวัด' }
  if (!POSTAL_RE.test(postal_code)) {
    return { ok: false, message: 'กรุณากรอกรหัสไปรษณีย์ 5 หลัก' }
  }

  const preferredRaw = input.preferred_contact_time?.trim() ?? ''
  if (preferredRaw && !isPreferredContactTimeOption(preferredRaw)) {
    return { ok: false, message: 'กรุณาเลือกช่วงเวลาที่สะดวกให้ติดต่อกลับ' }
  }

  let company_name: string | undefined
  let company_registration: string | undefined
  let director_first_name: string | undefined
  let director_last_name: string | undefined

  if (applicant_type === 'corporate') {
    company_name = input.company_name?.trim() ?? ''
    company_registration = input.company_registration?.replace(/\D/g, '') ?? ''
    director_first_name = input.director_first_name?.trim() ?? ''
    director_last_name = input.director_last_name?.trim() ?? ''
    if (!company_name) return { ok: false, message: 'กรุณากรอกชื่อบริษัท' }
    if (!COMPANY_REG_RE.test(company_registration)) {
      return { ok: false, message: 'กรุณากรอกเลขทะเบียนนิติบุคคล 13 หลัก' }
    }
    if (!isThaiName(director_first_name)) {
      return { ok: false, message: 'กรุณากรอกชื่อกรรมการผู้มีอำนาจเป็นภาษาไทย' }
    }
    if (!isThaiName(director_last_name)) {
      return { ok: false, message: 'กรุณากรอกนามสกุลกรรมการผู้มีอำนาจเป็นภาษาไทย' }
    }
  }

  const expected = input.security_code_expected?.trim().toLowerCase() ?? ''
  const given = input.security_code?.trim().toLowerCase() ?? ''
  if (!expected || given !== expected) {
    return { ok: false, message: 'รหัสความปลอดภัยไม่ถูกต้อง' }
  }

  const profile: InquiryContactProfile = {
    applicant_type,
    first_name,
    last_name,
    contact_phone: phone,
    address_line,
    subdistrict,
    district,
    province,
    postal_code,
    ...(preferredRaw
      ? { preferred_contact_time: preferredRaw }
      : {}),
    ...(applicant_type === 'corporate'
      ? {
          company_name: company_name!,
          company_registration: company_registration!,
          director_first_name: director_first_name!,
          director_last_name: director_last_name!,
        }
      : {}),
  }

  return { ok: true, profile }
}
