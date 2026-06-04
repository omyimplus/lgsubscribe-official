import { mapArticleRow } from '~~/server/utils/articleDb'
import { isArticlePublic } from '~~/shared/utils/articleDisplay'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'ต้องระบุ slug' })

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) throw createError({ statusCode: 404, message: 'ไม่พบบทความ' })

  const article = mapArticleRow(data)
  if (!isArticlePublic(article)) {
    throw createError({ statusCode: 404, message: 'บทความไม่เปิดเผย' })
  }

  return article
})
