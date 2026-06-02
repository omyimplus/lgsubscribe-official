import type { PromotionInput } from '~~/shared/types/promotion'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<Partial<PromotionInput>>(event)
  const patch: Record<string, unknown> = {}

  if (body.title !== undefined) patch.title = body.title.trim()
  if (body.slug !== undefined) patch.slug = body.slug.trim()
  if (body.description !== undefined) patch.description = body.description?.trim() || null
  if (body.headline !== undefined) patch.headline = body.headline?.trim() || null
  if (body.image_url !== undefined) patch.image_url = body.image_url?.trim() || null
  if (body.starts_at !== undefined) patch.starts_at = body.starts_at || null
  if (body.ends_at !== undefined) patch.ends_at = body.ends_at || null
  if (body.status !== undefined) patch.status = body.status
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order
  if (body.is_active !== undefined) patch.is_active = body.is_active

  if (!Object.keys(patch).length) {
    throw createError({ statusCode: 400, message: 'ไม่มีข้อมูลที่จะอัปเดต' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('promotions')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
