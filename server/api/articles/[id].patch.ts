import type { ArticleInput } from '~~/shared/types/article'
import {
  HOME_ARTICLES_CATEGORY,
  HOME_ARTICLES_LIMIT,
  isArticleCategorySlug,
} from '~~/shared/utils/articleDisplay'
import { mapArticleRow } from '~~/server/utils/articleDb'
import { sanitizeLgHtml } from '~~/server/utils/sanitizeLgHtml'

const VALID_CATEGORIES = new Set(['why-subscribe', 'how-to-order', 'knowledge'])

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<Partial<ArticleInput>>(event)
  const patch: Record<string, unknown> = {}

  if (body.title !== undefined) patch.title = body.title.trim()
  if (body.slug !== undefined) {
    const slug = body.slug.trim()
    if (isArticleCategorySlug(slug)) {
      throw createError({ statusCode: 400, message: 'slug ซ้ำกับหมวดบทความ ใช้ชื่ออื่น' })
    }
    patch.slug = slug
  }
  if (body.category !== undefined) {
    if (!VALID_CATEGORIES.has(body.category)) {
      throw createError({ statusCode: 400, message: 'หมวดบทความไม่ถูกต้อง' })
    }
    patch.category = body.category
  }
  if (body.excerpt !== undefined) patch.excerpt = body.excerpt?.trim() || null
  if (body.body_html !== undefined) {
    patch.body_html = body.body_html ? sanitizeLgHtml(body.body_html, 'standard') : null
  }
  if (body.cover_image_url !== undefined) patch.cover_image_url = body.cover_image_url?.trim() || null
  if (body.status !== undefined) patch.status = body.status
  if (body.is_active !== undefined) patch.is_active = body.is_active
  if (body.is_featured !== undefined) patch.is_featured = body.is_featured
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order
  if (body.published_at !== undefined) patch.published_at = body.published_at || null

  if (body.category !== undefined && body.category !== HOME_ARTICLES_CATEGORY) {
    patch.is_featured = false
  }
  else if (body.is_featured === false) {
    patch.is_featured = false
  }

  if (!Object.keys(patch).length) {
    throw createError({ statusCode: 400, message: 'ไม่มีข้อมูลที่จะอัปเดต' })
  }

  const supabase = useSupabaseAdmin()

  const willFeature = patch.is_featured === true
    || (body.is_featured === true && patch.is_featured !== false)
  if (willFeature) {
    const { count, error: countError } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('category', HOME_ARTICLES_CATEGORY)
      .eq('is_featured', true)
      .neq('id', id)
    if (countError) throw createError({ statusCode: 500, message: countError.message })
    if ((count ?? 0) >= HOME_ARTICLES_LIMIT) {
      throw createError({
        statusCode: 400,
        message: `หน้าแรกมีบทความครบ ${HOME_ARTICLES_LIMIT} ชิ้นแล้ว — ปิด «แสดงบนหน้าแรก» ของรายการอื่นก่อน`,
      })
    }
  }

  if (body.status === 'published') {
    const { data: existing } = await supabase
      .from('articles')
      .select('published_at')
      .eq('id', id)
      .maybeSingle()
    if (existing && !existing.published_at && body.published_at === undefined) {
      patch.published_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('articles')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return mapArticleRow(data)
})
