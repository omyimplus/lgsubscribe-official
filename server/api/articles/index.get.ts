import { articleListSelect, mapArticleRow } from '~~/server/utils/articleDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('articles')
    .select(articleListSelect)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(row => mapArticleRow(row))
})
