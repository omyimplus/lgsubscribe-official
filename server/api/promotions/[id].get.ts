import { fetchPromotionWithProducts } from '~~/server/utils/promotionProducts'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()
  const promotion = await fetchPromotionWithProducts(supabase, id)

  if (!promotion) throw createError({ statusCode: 404, message: 'ไม่พบโปรโมชั่น' })
  return promotion
})
