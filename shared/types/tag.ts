export interface Tag {
  id: string
  name: string
  slug: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TagInput {
  name: string
  slug: string
  color?: string
  sort_order?: number
  is_active?: boolean
}
