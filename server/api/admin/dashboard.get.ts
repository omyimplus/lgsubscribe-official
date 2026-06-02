import { isPromotionLive } from '~~/server/utils/promotionDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const [
    { data: products, error: productsErr },
    { count: customerCount, error: customersErr },
    { count: groupCount, error: groupsErr },
    { data: promotions, error: promotionsErr },
    { data: importBatch, error: importBatchErr },
    { data: recentProducts, error: recentProductsErr },
    { data: recentPromotions, error: recentPromotionsErr },
    { count: newInquiryCount, error: inquiriesErr },
  ] = await Promise.all([
    supabase.from('products').select('id, status, is_active'),
    supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('product_groups').select('id', { count: 'exact', head: true }),
    supabase.from('promotions').select('id, title, slug, status, is_active, starts_at, ends_at, updated_at'),
    supabase
      .from('import_batches')
      .select('id, source, status, created_at')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('products')
      .select('id, name, sku, status, updated_at, image_url')
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('promotions')
      .select('id, title, slug, status, is_active, updated_at, promotion_products ( product_id )')
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('subscription_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
  ])

  const err = productsErr ?? customersErr ?? groupsErr ?? promotionsErr
    ?? importBatchErr ?? recentProductsErr ?? recentPromotionsErr ?? inquiriesErr
  if (err) throw createError({ statusCode: 500, message: err.message })

  const productList = products ?? []
  const promotionList = promotions ?? []

  let importItemCount = 0
  if (importBatch) {
    const { count, error } = await supabase
      .from('import_products')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id', importBatch.id)
    if (error) throw createError({ statusCode: 500, message: error.message })
    importItemCount = count ?? 0
  }

  return {
    products: {
      total: productList.length,
      published: productList.filter(p => p.status === 'published').length,
      draft: productList.filter(p => p.status === 'draft').length,
      pending: productList.filter(p => p.status === 'pending').length,
      inactive: productList.filter(p => !p.is_active).length,
    },
    promotions: {
      total: promotionList.length,
      published: promotionList.filter(p => p.status === 'published').length,
      live: promotionList.filter(p => isPromotionLive(p)).length,
    },
    customers: customerCount ?? 0,
    productGroups: groupCount ?? 0,
    inquiries: { new: newInquiryCount ?? 0 },
    import: {
      batch: importBatch,
      itemCount: importItemCount,
    },
    recentProducts: recentProducts ?? [],
    recentPromotions: (recentPromotions ?? []).map((row) => {
      const links = (row.promotion_products ?? []) as { product_id: string }[]
      const { promotion_products: _, ...promo } = row as Record<string, unknown>
      return {
        ...promo,
        product_count: links.length,
      }
    }),
  }
})
