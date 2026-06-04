export type ArticleStatus = 'draft' | 'published'

export type ArticleCategory =
  | 'why-subscribe'
  | 'how-to-order'
  | 'knowledge'

export interface Article {
  id: string
  title: string
  slug: string
  category: ArticleCategory
  excerpt: string | null
  body_html: string | null
  cover_image_url: string | null
  status: ArticleStatus
  is_active: boolean
  is_featured: boolean
  sort_order: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ArticleInput {
  title: string
  slug: string
  category?: ArticleCategory
  excerpt?: string | null
  body_html?: string | null
  cover_image_url?: string | null
  status?: ArticleStatus
  is_active?: boolean
  is_featured?: boolean
  sort_order?: number
  published_at?: string | null
}

export type ArticleListItem = Pick<
  Article,
  | 'id'
  | 'title'
  | 'slug'
  | 'category'
  | 'excerpt'
  | 'cover_image_url'
  | 'status'
  | 'is_active'
  | 'is_featured'
  | 'sort_order'
  | 'published_at'
  | 'updated_at'
>
