import type { ProductInput } from '~~/shared/types/product'
import { computeProductPricing } from './productPricing'

export function buildProductRow(body: ProductInput) {
  const pricing = computeProductPricing(
    body.base_price,
    body.discount_type,
    body.discount_value,
  )

  const imageUrls = (body.image_urls ?? [])
    .map(url => url.trim())
    .filter(Boolean)

  const primaryImage = body.image_url?.trim() || imageUrls[0] || null

  return {
    category_id: body.category_id,
    name: body.name.trim(),
    sku: body.sku.trim(),
    headline: body.headline?.trim() || null,
    description: body.description ?? null,
    faq_html: body.faq_html ?? null,
    key_features: body.key_features ?? null,
    features: body.features ?? null,
    specifications: body.specifications ?? null,
    image_url: primaryImage,
    image_urls: imageUrls,
    base_price: body.base_price,
    full_price: body.full_price ?? null,
    price_range: body.price_range?.trim() || null,
    subscription_note: body.subscription_note?.trim() || null,
    purchase_only_label: body.purchase_only_label?.trim() || null,
    purchase_only_url: body.purchase_only_url?.trim() || null,
    discount_type: body.discount_type ?? null,
    discount_value: body.discount_value ?? null,
    discounted_price: pricing.discounted_price,
    discount_percent: pricing.discount_percent,
    service_self_clean: body.service_self_clean ?? false,
    service_technician: body.service_technician ?? false,
    service_months: body.service_months ?? null,
    installment_months: body.installment_months ?? null,
    warranty_years: body.warranty_years ?? null,
    status: body.status ?? 'draft',
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
  }
}

export async function syncProductTags(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  productId: string,
  tagIds?: string[],
) {
  await supabase.from('product_tags').delete().eq('product_id', productId)

  if (!tagIds?.length) return

  const rows = tagIds.map(tag_id => ({ product_id: productId, tag_id }))
  const { error } = await supabase.from('product_tags').insert(rows)
  if (error) throw error
}

export const productSelect = `
  *,
  category:categories (
    id,
    name,
    slug,
    main_category:main_categories ( id, name, slug )
  ),
  product_group:product_groups (
    id,
    group_key,
    display_name,
    sort_order
  ),
  product_tags (
    tag:tags ( id, name, slug, color )
  )
`

export function mapProduct<T extends Record<string, unknown>>(row: T) {
  const r = row as Record<string, unknown>
  const productTags = r.product_tags as { tag: unknown }[] | undefined
  const imageUrls = Array.isArray(r.image_urls)
    ? (r.image_urls as unknown[]).filter((u): u is string => typeof u === 'string')
    : []

  return {
    ...r,
    image_urls: imageUrls,
    key_features: typeof r.key_features === 'string' ? r.key_features : null,
    features: typeof r.features === 'string' ? r.features : null,
    specifications: typeof r.specifications === 'string' ? r.specifications : null,
    faq_html: typeof r.faq_html === 'string' ? r.faq_html : null,
    tags: productTags?.map(pt => pt.tag).filter(Boolean) ?? [],
    product_tags: undefined,
  }
}
