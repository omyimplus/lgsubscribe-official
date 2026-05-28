import type { MainCategory } from './main-category'

export interface Category {
  id: string
  name: string
  slug: string
  main_category_id: string | null
  icon: string | null
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  main_category?: Pick<MainCategory, 'id' | 'name' | 'slug'> | null
}

export interface CategoryInput {
  name: string
  slug: string
  main_category_id: string
  icon?: string | null
  description?: string | null
  sort_order?: number
  is_active?: boolean
}
