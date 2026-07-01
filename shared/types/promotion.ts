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

export interface PromotionOfferGift {
  product_id: string
  label: string | null
  sort_order: number
}

export interface PromotionOfferGiftEnriched extends PromotionOfferGift {
  product?: Product
}

/** แถวชิ้นในหน้าโปร — สินค้าเดียวกันใส่ซ้ำได้คนละแถว */
export interface PromotionProductOffer {
  id: string
  product_id: string
  sort_order: number
  title_override: string | null
  description: string | null
  has_gift: boolean
  gift_items: PromotionOfferGift[]
  installment_monthly: number | null
  installment_total: number | null
}

export interface PromotionProductOfferEnriched extends PromotionProductOffer {
  product?: Product
  gift_items: PromotionOfferGiftEnriched[]
}

export type PromotionOfferGiftInput = Omit<PromotionOfferGift, 'sort_order'> & {
  sort_order?: number
}

export type PromotionProductOfferInput = Omit<PromotionProductOffer, 'id' | 'sort_order' | 'gift_items'> & {
  sort_order?: number
  gift_items?: PromotionOfferGiftInput[]
}

export interface PromotionWithProducts extends Promotion {
  product_ids: string[]
  offers: PromotionProductOfferEnriched[]
  products?: Product[]
}

export interface PromotionProductsInput {
  /** @deprecated ใช้ offers แทน */
  product_ids?: string[]
  offers?: PromotionProductOfferInput[]
}
