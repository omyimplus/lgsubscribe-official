export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  const listCards = await collectTvListCards(3).catch((error: any) => {
    throw createError({
      statusCode: 503,
      message: error?.message || 'เปิดหน้าจอไม่ขึ้น',
    })
  })
  const detailUrls = listCards.map(card => card.source_url).filter(Boolean)

  if (!detailUrls.length) {
    throw createError({ statusCode: 400, message: 'ไม่พบรายการทีวีจากหน้า source' })
  }

  const { data: tvCategory, error: catErr } = await supabase
    .from('categories')
    .select('id, name, slug')
    .or('slug.eq.television,name.ilike.%โทรทัศน์%')
    .limit(1)
    .maybeSingle()

  if (catErr || !tvCategory?.id) {
    throw createError({ statusCode: 400, message: 'ไม่พบหมวดโทรทัศน์ในระบบ' })
  }

  const { data: batch, error: batchErr } = await supabase
    .from('import_batches')
    .insert({ source: 'lg.com', status: 'draft', note: 'TV import test 3 items' })
    .select('*')
    .single()
  if (batchErr || !batch) {
    throw createError({ statusCode: 500, message: batchErr?.message ?? 'สร้าง import batch ไม่สำเร็จ' })
  }

  let count = 0
  for (const url of detailUrls) {
    const listCard = listCards.find(card => card.source_url === url)
    const parsed = await parseTvDetail(url)
    const resolvedName = listCard?.name ?? parsed.name
    const resolvedSku = parsed.sku ?? listCard?.model_key
    if (!resolvedName || !resolvedSku) continue

    const mergedBasePrice = listCard?.base_price ?? parsed.base_price
    const mergedFullPrice = listCard?.full_price ?? parsed.full_price
    const mergedHeadline = listCard?.headline ?? parsed.headline

    const { error } = await supabase
      .from('import_products')
      .upsert({
        batch_id: batch.id,
        source_url: parsed.source_url,
        category_id: tvCategory.id,
        name: resolvedName,
        sku: resolvedSku,
        headline: mergedHeadline,
        description: parsed.description,
        faq_html: parsed.faq_html,
        image_url: parsed.image_url,
        image_urls: parsed.image_urls,
        key_features: parsed.key_features,
        features: parsed.features,
        specifications: parsed.specifications,
        base_price: mergedBasePrice ?? 0,
        full_price: mergedFullPrice,
        price_range: null,
        subscription_note: listCard?.subscription_note ?? null,
        purchase_only_label: listCard?.purchase_only_label ?? null,
        purchase_only_url: listCard?.purchase_only_url ?? null,
        discount_type: null,
        discount_value: null,
        service_self_clean: false,
        service_technician: false,
        service_months: null,
        installment_months: null,
        warranty_years: listCard?.warranty_years ?? null,
        sort_order: 0,
        is_active: true,
      }, { onConflict: 'batch_id,sku' })

    if (!error) {
      count += 1
    }
  }

  return { count, detailUrls, batchId: batch.id }
})
