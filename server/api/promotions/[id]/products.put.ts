import type { PromotionProductsInput } from '~~/shared/types/promotion'
import { fetchPromotionWithProducts, syncPromotionProducts } from '~~/server/utils/promotionProducts'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<PromotionProductsInput>(event)
  const productIds = [...new Set((body.product_ids ?? []).filter(Boolean))]

  const supabase = useSupabaseAdmin()

  const { data: promotion, error: promoErr } = await supabase
    .from('promotions')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (promoErr) throw createError({ statusCode: 500, message: promoErr.message })
  if (!promotion) throw createError({ statusCode: 404, message: 'ไม่พบโปรโมชั่น' })

  if (productIds.length) {
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id')
      .in('id', productIds)

    if (prodErr) throw createError({ statusCode: 500, message: prodErr.message })

    const found = new Set((products ?? []).map(p => p.id))
    const missing = productIds.filter(pid => !found.has(pid))
    if (missing.length) {
      throw createError({ statusCode: 400, message: `ไม่พบสินค้า: ${missing.join(', ')}` })
    }
  }

  try {
    await syncPromotionProducts(supabase, id, productIds)
  }
  catch (err: any) {
    throw createError({ statusCode: 400, message: err.message ?? 'บันทึกรายการสินค้าไม่สำเร็จ' })
  }

  const result = await fetchPromotionWithProducts(supabase, id)
  return result
})
