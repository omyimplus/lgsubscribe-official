export interface MainCategory {
  id: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MainCategoryInput {
  name: string
  slug: string
  sort_order?: number
  is_active?: boolean
}
