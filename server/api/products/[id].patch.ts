import type { ProductInput } from '~~/shared/types/product'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<Partial<ProductInput>>(event)
  const supabase = useSupabaseAdmin()

  const { data: existing } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!existing) throw createError({ statusCode: 404, message: 'ไม่พบสินค้า' })

  const merged: ProductInput = {
    category_id: body.category_id ?? existing.category_id,
    name: body.name ?? existing.name,
    sku: body.sku ?? existing.sku,
    headline: body.headline !== undefined ? body.headline : existing.headline,
    description: body.description !== undefined ? body.description : existing.description,
    faq_html: body.faq_html !== undefined ? body.faq_html : existing.faq_html,
    key_features: body.key_features !== undefined ? body.key_features : existing.key_features,
    features: body.features !== undefined ? body.features : existing.features,
    specifications: body.specifications !== undefined ? body.specifications : existing.specifications,
    image_url: body.image_url !== undefined ? body.image_url : existing.image_url,
    image_urls: body.image_urls !== undefined ? body.image_urls : (Array.isArray(existing.image_urls) ? existing.image_urls : []),
    base_price: body.base_price ?? Number(existing.base_price),
    full_price: body.full_price !== undefined ? body.full_price : existing.full_price,
    price_range: body.price_range !== undefined ? body.price_range : existing.price_range,
    subscription_note: body.subscription_note !== undefined ? body.subscription_note : existing.subscription_note,
    purchase_only_label: body.purchase_only_label !== undefined ? body.purchase_only_label : existing.purchase_only_label,
    purchase_only_url: body.purchase_only_url !== undefined ? body.purchase_only_url : existing.purchase_only_url,
    discount_type: body.discount_type !== undefined ? body.discount_type : existing.discount_type,
    discount_value: body.discount_value !== undefined ? body.discount_value : existing.discount_value,
    service_self_clean: body.service_self_clean ?? existing.service_self_clean,
    service_technician: body.service_technician ?? existing.service_technician,
    service_months: body.service_months !== undefined ? body.service_months : existing.service_months,
    installment_months: body.installment_months !== undefined ? body.installment_months : existing.installment_months,
    warranty_years: body.warranty_years !== undefined ? body.warranty_years : existing.warranty_years,
    status: body.status ?? existing.status,
    sort_order: body.sort_order ?? existing.sort_order,
    is_active: body.is_active ?? existing.is_active,
    tag_ids: body.tag_ids,
  }

  const row = buildProductRow(merged)
  const { name, sku, ...updateRow } = row

  const { error } = await supabase
    .from('products')
    .update({
      ...updateRow,
      ...(body.name !== undefined && { name }),
      ...(body.sku !== undefined && { sku }),
    })
    .eq('id', id)

  if (error) throw createError({ statusCode: 400, message: error.message })

  if (body.tag_ids !== undefined) {
    await syncProductTags(supabase, id, body.tag_ids)
  }

  if (body.plans_locked !== undefined) {
    const { error: lockErr } = await supabase
      .from('products')
      .update({ plans_locked: body.plans_locked })
      .eq('id', id)

    if (lockErr) throw createError({ statusCode: 400, message: lockErr.message })
  }

  const { data: full, error: fetchErr } = await supabase
    .from('products')
    .select(productSelect)
    .eq('id', id)
    .single()

  if (fetchErr) throw createError({ statusCode: 500, message: fetchErr.message })
  return mapProduct(full!)
})
