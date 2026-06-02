import type { PromotionInput } from '~~/shared/types/promotion'

export default defineEventHandler(async (event) => {
  const body = await readBody<PromotionInput>(event)

  if (!body.title?.trim() || !body.slug?.trim()) {
    throw createError({ statusCode: 400, message: 'title และ slug จำเป็นต้องมี' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('promotions')
    .insert({
      title: body.title.trim(),
      slug: body.slug.trim(),
      description: body.description?.trim() || null,
      headline: body.headline?.trim() || null,
      image_url: body.image_url?.trim() || null,
      starts_at: body.starts_at || null,
      ends_at: body.ends_at || null,
      status: body.status ?? 'draft',
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
