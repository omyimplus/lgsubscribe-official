import {
  HOME_FEATURED_TAG_NAME,
  HOME_FEATURED_TAG_SLUG,
} from '~~/shared/utils/homeFeatured'
import { mapProduct, productSelect } from '~~/server/utils/productDb'
import { fetchStorefrontPlansForProducts } from '~~/server/utils/productPlanStorefront'

type SupabaseAdmin = ReturnType<typeof useSupabaseAdmin>

export async function resolveHomeFeaturedTagId(supabase: SupabaseAdmin) {
  const { data: bySlug, error: slugErr } = await supabase
    .from('tags')
    .select('id')
    .eq('slug', HOME_FEATURED_TAG_SLUG)
    .eq('is_active', true)
    .maybeSingle()

  if (slugErr) throw slugErr
  if (bySlug?.id) return bySlug.id

  const { data: byName, error: nameErr } = await supabase
    .from('tags')
    .select('id')
    .eq('name', HOME_FEATURED_TAG_NAME)
    .eq('is_active', true)
    .maybeSingle()

  if (nameErr) throw nameErr
  return byName?.id ?? null
}

export async function fetchHomeFeaturedStorefrontProducts(supabase: SupabaseAdmin) {
  const tagId = await resolveHomeFeaturedTagId(supabase)
  if (!tagId) return []

  const { data: links, error: linkErr } = await supabase
    .from('product_tags')
    .select('product_id')
    .eq('tag_id', tagId)

  if (linkErr) throw linkErr

  const productIds = [...new Set((links ?? []).map(row => row.product_id))]
  if (!productIds.length) return []

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .in('id', productIds)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

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
}
