import type { Category } from './category'
import type { Tag } from './tag'

export type ProductStatus = 'draft' | 'published' | 'pending'
export type DiscountType = 'amount' | 'percent'

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
  created_at: string
  updated_at: string
  category?: Pick<Category, 'id' | 'name' | 'slug'> & {
    main_category?: { id: string, name: string, slug: string } | null
  } | null
  tags?: Pick<Tag, 'id' | 'name' | 'slug' | 'color'>[]
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
}
