export interface FaqItem {
  id: string
  tab_title: string
  body_html: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FaqItemInput {
  tab_title: string
  body_html?: string | null
  sort_order?: number
  is_active?: boolean
}
