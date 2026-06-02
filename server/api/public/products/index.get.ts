import { fetchStorefrontPlansForProducts } from '~~/server/utils/productPlanStorefront'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  const products = (data ?? []).map(row => mapProduct(row))
  const planBundles = await fetchStorefrontPlansForProducts(supabase, products)

  return products.map((p) => {
    const bundle = planBundles.get(p.id)
    return {
      ...p,
      plan_pricing: bundle?.plan_pricing ?? null,
      plans: bundle?.plans ?? [],
    }
  })
})
