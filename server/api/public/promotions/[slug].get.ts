import { fetchPromotionWithProducts } from '~~/server/utils/promotionProducts'
import { isPromotionLive } from '~~/server/utils/promotionDb'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'ต้องระบุ slug' })

  const supabase = useSupabaseAdmin()

  const { data: row, error } = await supabase
    .from('promotions')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!row) throw createError({ statusCode: 404, message: 'ไม่พบโปรโมชั่น' })

  const promotion = await fetchPromotionWithProducts(supabase, row.id)
  if (!promotion || !isPromotionLive(promotion)) {
    throw createError({ statusCode: 404, message: 'โปรโมชั่นไม่เปิดใช้งาน' })
  }

  return promotion
})
