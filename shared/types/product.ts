import type { Category } from './category'
import type { ProductPlanCardOption, ProductPlanPricingSummary } from './productPlan'
import type { Tag } from './tag'

export type ProductStatus = 'draft' | 'published' | 'pending'
export type DiscountType = 'amount' | 'percent'

export interface ProductGroup {
  id: string
  group_key: string
  display_name: string
  category_id: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductGroupMember {
  id: string
  sku: string
  name: string
  variant_label: string | null
  variant_sort: number | null
  image_url: string | null
  group_id_locked: boolean
}

export interface ProductGroupWithMembers extends ProductGroup {
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null
  products: ProductGroupMember[]
}

export interface ProductGroupInput {
  display_name: string
  category_id: string
  product_ids?: string[]
}

export interface ProductGroupPatch {
  display_name?: string
  sort_order?: number
  is_active?: boolean
}

export interface ProductGroupMembersPatch {
  add?: string[]
  remove?: string[]
  variant_labels?: Record<string, string>
}

export interface Product {
  id: string
  category_id: string
  name: string
  sku: string
  headline: string | null
  description: string | null
  faq_html: string | null
  image_url: string | null
  image_urls: string[]
  key_features: string | null
  features: string | null
  specifications: string | null
  base_price: number
  full_price: number | null
  price_range: string | null
  subscription_note: string | null
  purchase_only_label: string | null
  purchase_only_url: string | null
  discount_type: DiscountType | null
  discount_value: number | null
  discounted_price: number | null
  discount_percent: number | null
  service_self_clean: boolean
  service_technician: boolean
  service_months: number | null
  installment_months: number | null
  warranty_years: number | null
  status: ProductStatus
  sort_order: number
  is_active: boolean
  group_id: string | null
  group_id_locked: boolean
  default_plan_id: string | null
  plans_locked: boolean
  variant_label: string | null
  variant_sort: number | null
  created_at: string
  updated_at: string
  product_group?: Pick<ProductGroup, 'id' | 'group_key' | 'display_name' | 'sort_order'> | null
  category?: Pick<Category, 'id' | 'name' | 'slug'> & {
    main_category?: { id: string, name: string, slug: string } | null
  } | null
  tags?: Pick<Tag, 'id' | 'name' | 'slug' | 'color'>[]
  /** ราคาจากแผนสัญญา default — ไม่ใช้ legacy price บนหน้าร้าน */
  plan_pricing?: ProductPlanPricingSummary | null
  /** แผนที่เปิดใช้งาน — สำหรับเลือกบนการ์ด PLP */
  plans?: ProductPlanCardOption[]
}

export interface ProductInput {
  category_id: string
  name: string
  sku: string
  headline?: string | null
  description?: string | null
  faq_html?: string | null
  image_url?: string | null
  image_urls?: string[]
  key_features?: string | null
  features?: string | null
  specifications?: string | null
  base_price: number
  full_price?: number | null
  price_range?: string | null
  subscription_note?: string | null
  purchase_only_label?: string | null
  purchase_only_url?: string | null
  discount_type?: DiscountType | null
  discount_value?: number | null
  service_self_clean?: boolean
  service_technician?: boolean
  service_months?: number | null
  installment_months?: number | null
  warranty_years?: number | null
  status?: ProductStatus
  sort_order?: number
  is_active?: boolean
  tag_ids?: string[]
  plans_locked?: boolean
}
