import type { ProductInput } from '~~/shared/types/product'

export default defineEventHandler(async (event) => {
  const body = await readBody<ProductInput>(event)

  if (!body.name?.trim() || !body.sku?.trim() || !body.category_id) {
    throw createError({ statusCode: 400, message: 'name, sku และ category จำเป็นต้องมี' })
  }

  const supabase = useSupabaseAdmin()
  const row = buildProductRow(body)

  const { data, error } = await supabase
    .from('products')
    .insert(row)
    .select(productSelect)
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  try {
    await syncProductTags(supabase, data.id, body.tag_ids)
  }
  catch (e: any) {
    await supabase.from('products').delete().eq('id', data.id)
    throw createError({ statusCode: 400, message: e.message })
  }

  const { data: full } = await supabase
    .from('products')
    .select(productSelect)
    .eq('id', data.id)
    .single()

  return mapProduct(full!)
})
