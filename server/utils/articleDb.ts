import type { Article } from '~~/shared/types/article'

export function mapArticleRow<T extends Record<string, unknown>>(row: T) {
  return row as T & Article
}

export const articleListSelect = `
  id,
  title,
  slug,
  category,
  excerpt,
  cover_image_url,
  status,
  is_active,
  is_featured,
  sort_order,
  published_at,
  updated_at
`
