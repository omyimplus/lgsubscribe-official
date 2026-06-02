import type { PromotionWithProducts } from '~~/shared/types/promotion'
import { mapProduct, productSelect } from '~~/server/utils/productDb'
import { mapPromotionRow } from '~~/server/utils/promotionDb'

export async function fetchPromotionWithProducts(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  promotionId: string,
) {
  const { data: promotionRow, error: promoErr } = await supabase
    .from('promotions')
    .select('*')
    .eq('id', promotionId)
    .maybeSingle()

  if (promoErr) throw promoErr
  if (!promotionRow) return null

  const { data: links, error: linkErr } = await supabase
    .from('promotion_products')
    .select('product_id, sort_order')
    .eq('promotion_id', promotionId)
    .order('sort_order', { ascending: true })

  if (linkErr) throw linkErr

  const productIds = (links ?? []).map(l => l.product_id)
  let products: ReturnType<typeof mapProduct>[] = []

  if (productIds.length) {
    const { data: productRows, error: prodErr } = await supabase
      .from('products')
      .select(productSelect)
      .in('id', productIds)

    if (prodErr) throw prodErr

    const byId = new Map((productRows ?? []).map(row => [row.id as string, mapProduct(row)]))
    products = productIds
      .map(id => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
  }

  return {
    ...mapPromotionRow(promotionRow as Record<string, unknown>),
    product_ids: productIds,
    products,
  } satisfies PromotionWithProducts
}

export async function syncPromotionProducts(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  promotionId: string,
  productIds: string[],
) {
  await supabase.from('promotion_products').delete().eq('promotion_id', promotionId)

  if (!productIds.length) return

  const rows = productIds.map((product_id, index) => ({
    promotion_id: promotionId,
    product_id,
    sort_order: index,
  }))

  const { error } = await supabase.from('promotion_products').insert(rows)
  if (error) throw error
}
