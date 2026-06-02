import { isPromotionLive, mapPromotionRow } from '~~/server/utils/promotionDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('promotions')
    .select(`
      *,
      promotion_products ( product_id )
    `)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return (data ?? [])
    .map((row) => {
      const links = (row.promotion_products ?? []) as { product_id: string }[]
      const { promotion_products: _, ...promotion } = row as Record<string, unknown>
      return {
        ...mapPromotionRow(promotion),
        product_count: links.length,
      }
    })
    .filter(p => isPromotionLive(p))
})
