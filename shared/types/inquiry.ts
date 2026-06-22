import type { ComboCustomerSegment } from './comboProgram'
import type { ComboQuoteResult } from '~~/shared/utils/comboPricing'
import type { ServiceMode } from './productPlan'

/** ผล combo ที่คำนวณตอนส่งคำขอ (จากแผนใน DB) */
export type InquiryComboSnapshot = {
  customer_segment: ComboCustomerSegment
  program_id: string | null
  program_name: string | null
  quote: ComboQuoteResult
  quoted_at: string
}

export type InquiryStatus = 'new' | 'contacted' | 'closed'

export type InquiryApplicantType = 'individual' | 'corporate'

export type InquiryContactProfile = {
  applicant_type: InquiryApplicantType
  first_name: string
  last_name: string
  contact_phone: string
  address_line: string
  subdistrict: string
  district: string
  province: string
  postal_code: string
  company_name?: string
  company_registration?: string
  director_first_name?: string
  director_last_name?: string
  preferred_contact_time?: string
}

export type InquiryBillingTierSnapshot = {
  bill_from: number
  bill_to: number
  monthly_price: number
  note?: string | null
}

export type InquiryItem = {
  product_id: string
  plan_id: string
  sku: string
  name: string
  /** ราคา/เดือนจาก tier แรกของแผนที่เลือก */
  monthly_price: number
  image_url: string | null
  policy_code: string
  contract_label: string
  service_mode: ServiceMode
  contract_years: number
  contract_months: number
  billing_tiers: InquiryBillingTierSnapshot[]
  advance_amount: number | null
  advance_note: string | null
  display_monthly_price: number
  display_price_note: string | null
  computed_total?: number
  computed_net_total?: number
  /** จำนวนชิ้นในรายการ (default 1) */
  quantity?: number
}

export interface SubscriptionInquiry {
  id: string
  customer_id: string | null
  applicant_type?: InquiryApplicantType
  contact_profile?: InquiryContactProfile
  contact_name: string
  contact_phone: string
  contact_line_id: string
  contact_note: string
  items: InquiryItem[]
  status: InquiryStatus
  created_at: string
  updated_at: string
  combo_customer_segment?: ComboCustomerSegment | null
  combo_snapshot?: InquiryComboSnapshot | null
}

export type InquiryCartItemInput = {
  product_id: string
  plan_id: string
  quantity?: number
}

export interface SubscriptionInquiryInput {
  applicant_type: InquiryApplicantType
  first_name: string
  last_name: string
  contact_phone: string
  address_line: string
  subdistrict: string
  district: string
  province: string
  postal_code: string
  company_name?: string
  company_registration?: string
  director_first_name?: string
  director_last_name?: string
  preferred_contact_time?: string
  security_code: string
  security_code_expected: string
  contact_line_id?: string
  contact_note?: string
  /** @deprecated */
  contact_name?: string
  /** @deprecated ใช้ items แทน — จะ resolve default plan ฝั่ง server */
  product_ids?: string[]
  items?: InquiryCartItemInput[]
  /** ลูกค้าใหม่ / เก่า — ใช้คำนวณ combo ฝั่ง server */
  combo_customer_segment?: ComboCustomerSegment
}

export interface SubscriptionInquiryCreateResponse {
  id: string
  line_summary: string
}
