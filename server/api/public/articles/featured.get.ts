import { HOME_ARTICLES_CATEGORY, HOME_ARTICLES_LIMIT } from '~~/shared/utils/articleDisplay'
import { articleListSelect, mapArticleRow } from '~~/server/utils/articleDb'

/** บทความบนหน้าแรก — หมวดสาระน่ารู้ ที่ติ๊ก «แสดงบนหน้าแรก» สูงสุด 4 ชิ้น */
export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('articles')
    .select(articleListSelect)
    .eq('status', 'published')
    .eq('is_active', true)
    .eq('category', HOME_ARTICLES_CATEGORY)
    .eq('is_featured', true)
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(HOME_ARTICLES_LIMIT)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(row => mapArticleRow(row))
})
