export interface CustomerExperience {
  id: string
  title: string
  description: string | null
  /** รูปแรก (ซิงค์จาก image_urls) — ใช้ thumbnail */
  image_url: string | null
  image_urls: string[]
  event_date: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerExperienceInput {
  title: string
  description?: string | null
  image_url?: string | null
  image_urls?: string[]
  event_date?: string | null
  sort_order?: number
  is_active?: boolean
}

export type CustomerExperiencePublic = Pick<
  CustomerExperience,
  'id' | 'title' | 'description' | 'image_url' | 'image_urls' | 'event_date' | 'sort_order'
>
