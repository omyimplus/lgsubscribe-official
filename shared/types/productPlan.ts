import type { Product } from './product'

export type ServiceMode = 'visit' | 'self' | 'none'
export type SaleType = 'subscription'

export interface PlanGift {
  product_id: string
  label: string | null
  sort_order: number
}

export interface PlanGiftEnriched extends PlanGift {
  product?: Pick<Product, 'id' | 'name' | 'sku' | 'image_url'> | null
}

export type PlanGiftInput = Omit<PlanGift, 'sort_order'> & {
  sort_order?: number
}

export interface PlanBillingTier {
  id: string
  plan_id: string
  bill_from: number
  bill_to: number
  monthly_price: number
  note: string | null
  sort_order: number
}

export interface PlanBillingTierInput {
  bill_from: number
  bill_to: number
  monthly_price: number
  note?: string | null
  sort_order?: number
}

export interface ProductPlan {
  id: string
  product_id: string
  policy_code: string | null
  contract_label: string
  plan_title: string | null
  contract_years: number
  contract_months: number
  service_mode: ServiceMode
  service_interval_months: number | null
  sale_type: SaleType
  list_price: number | null
  promo_price: number | null
  advance_amount: number | null
  advance_note: string | null
  is_default: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  billing_tiers?: PlanBillingTier[]
  has_gift: boolean
  gift_items?: PlanGiftEnriched[]
  computed_total?: number
  computed_net_total?: number
  display_monthly_price?: number | null
}

/** แผนย่อสำหรับเลือกบนการ์ดสินค้า (PLP) */
export interface ProductPlanCardOption {
  id: string
  contract_label: string
  plan_title: string | null
  contract_years: number
  contract_months: number
  service_mode: ServiceMode
  service_interval_months: number | null
  policy_code: string | null
  advance_amount: number | null
  advance_note: string | null
  display_monthly_price: number | null
  display_price_note: string | null
  computed_total: number | null
  computed_net_total: number | null
  is_default: boolean
  sort_order?: number
  billing_tiers: Pick<PlanBillingTier, 'bill_from' | 'bill_to' | 'monthly_price' | 'note' | 'sort_order'>[]
  has_gift: boolean
  gift_items: PlanGiftEnriched[]
}

/** สรุปราคา default plan สำหรับการ์ดสินค้า (PLP) */
export interface ProductPlanPricingSummary {
  plan_id: string
  contract_label: string
  plan_title: string | null
  contract_years: number
  service_mode: ServiceMode
  display_monthly_price: number | null
  display_price_note: string | null
  computed_total: number | null
  computed_net_total: number | null
  advance_amount: number | null
  advance_note: string | null
  /** จำนวนแผนที่เปิดใช้งาน — ถ้า > 1 แสดง "เริ่ม X บ./เดือน" */
  plan_count: number
  /** ราคา/เดือนต่ำสุดจาก tier แรกของทุกแผน (สำหรับ badge หลายแผน) */
  from_monthly_price: number | null
}

export interface CreatePlanInput {
  policy_code?: string | null
  contract_label?: string
  contract_years: number
  contract_months?: number
  service_mode: ServiceMode
  service_interval_months?: number | null
  sale_type?: SaleType
  list_price?: number | null
  promo_price?: number | null
  advance_amount?: number | null
  advance_note?: string | null
  plan_title?: string | null
  is_default?: boolean
  is_active?: boolean
  sort_order?: number
  billing_tiers: PlanBillingTierInput[]
  has_gift?: boolean
  gift_items?: PlanGiftInput[]
}

export interface UpdatePlanInput {
  policy_code?: string | null
  contract_years?: number
  contract_months?: number
  service_mode?: ServiceMode
  service_interval_months?: number | null
  sale_type?: SaleType
  list_price?: number | null
  promo_price?: number | null
  advance_amount?: number | null
  advance_note?: string | null
  plan_title?: string | null
  is_default?: boolean
  is_active?: boolean
  sort_order?: number
  billing_tiers?: PlanBillingTierInput[]
  has_gift?: boolean
  gift_items?: PlanGiftInput[]
}

export interface ProductPlansResponse {
  product_id: string
  default_plan_id: string | null
  plans: ProductPlan[]
}
