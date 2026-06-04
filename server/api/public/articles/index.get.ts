import type { ArticleCategory } from '~~/shared/types/article'
import { articleListSelect, mapArticleRow } from '~~/server/utils/articleDb'

const VALID_CATEGORIES = new Set(['why-subscribe', 'how-to-order', 'knowledge'])

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = typeof query.category === 'string' ? query.category.trim() : ''

  const supabase = useSupabaseAdmin()

  let q = supabase
    .from('articles')
    .select(articleListSelect)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false, nullsFirst: false })

  if (category) {
    if (!VALID_CATEGORIES.has(category)) {
      throw createError({ statusCode: 400, message: 'หมวดบทความไม่ถูกต้อง' })
    }
    q = q.eq('category', category as ArticleCategory)
  }

  const { data, error } = await q
  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(row => mapArticleRow(row))
})
