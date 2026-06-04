import type { ArticleInput } from '~~/shared/types/article'
import { isArticleCategorySlug } from '~~/shared/utils/articleDisplay'
import { mapArticleRow } from '~~/server/utils/articleDb'
import { sanitizeLgHtml } from '~~/server/utils/sanitizeLgHtml'

const VALID_CATEGORIES = new Set(['why-subscribe', 'how-to-order', 'knowledge'])

export default defineEventHandler(async (event) => {
  const body = await readBody<ArticleInput>(event)

  if (!body.title?.trim() || !body.slug?.trim()) {
    throw createError({ statusCode: 400, message: 'title และ slug จำเป็นต้องมี' })
  }

  const slug = body.slug.trim()
  if (isArticleCategorySlug(slug)) {
    throw createError({ statusCode: 400, message: 'slug ซ้ำกับหมวดบทความ ใช้ชื่ออื่น' })
  }

  const category = body.category ?? 'knowledge'
  if (!VALID_CATEGORIES.has(category)) {
    throw createError({ statusCode: 400, message: 'หมวดบทความไม่ถูกต้อง' })
  }

  const status = body.status ?? 'draft'
  const publishedAt = status === 'published' ? new Date().toISOString() : null

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('articles')
    .insert({
      title: body.title.trim(),
      slug,
      category,
      excerpt: body.excerpt?.trim() || null,
      body_html: body.body_html ? sanitizeLgHtml(body.body_html, 'standard') : null,
      cover_image_url: body.cover_image_url?.trim() || null,
      status,
      is_active: body.is_active ?? true,
      is_featured: body.is_featured ?? false,
      sort_order: body.sort_order ?? 0,
      published_at: publishedAt,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return mapArticleRow(data)
})
