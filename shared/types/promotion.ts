import type { Product } from './product'

export type PromotionStatus = 'draft' | 'published'

export interface Promotion {
  id: string
  title: string
  slug: string
  description: string | null
  headline: string | null
  image_url: string | null
  starts_at: string | null
  ends_at: string | null
  status: PromotionStatus
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromotionInput {
  title: string
  slug: string
  description?: string | null
  headline?: string | null
  image_url?: string | null
  starts_at?: string | null
  ends_at?: string | null
  status?: PromotionStatus
  sort_order?: number
  is_active?: boolean
}

export interface PromotionWithProducts extends Promotion {
  product_ids: string[]
  products?: Product[]
}

export interface PromotionProductsInput {
  product_ids: string[]
}
