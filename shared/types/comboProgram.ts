export type ComboProgramStatus = 'draft' | 'published'

export type ComboCustomerSegment = 'new' | 'existing'

/** min_floor = ตั้งแต่ X ชิ้นขึ้นไป (1 ชั้น) · stepped = หลายขั้น เช่น 2/5/7 ชิ้น */
export type ComboTierMode = 'min_floor' | 'stepped'

export interface ComboProgramTier {
  id: string
  program_id: string
  min_items: number
  max_items: number | null
  extra_discount_percent: number
  sort_order: number
  created_at: string
}

export interface ComboProgram {
  id: string
  name: string
  status: ComboProgramStatus
  customer_segment: ComboCustomerSegment
  tier_mode: ComboTierMode
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ComboProgramTierInput {
  id?: string
  min_items: number
  max_items?: number | null
  extra_discount_percent: number
  sort_order?: number
}

export interface ComboProgramInput {
  name: string
  status?: ComboProgramStatus
  customer_segment: ComboCustomerSegment
  tier_mode?: ComboTierMode
  starts_at?: string | null
  ends_at?: string | null
  is_active?: boolean
  notes?: string | null
  tiers?: ComboProgramTierInput[]
}

export interface ComboProgramListRow extends ComboProgram {
  tier_count: number
}

export interface ComboProgramWithDetails extends ComboProgram {
  tiers: ComboProgramTier[]
}

/** โปรแกรม combo ที่เผยแพร่แล้ว — สำหรับหน้าร้าน / ตะกร้า */
export interface PublicComboProgram extends ComboProgram {
  tiers: Pick<ComboProgramTier, 'min_items' | 'max_items' | 'extra_discount_percent' | 'sort_order'>[]
}
