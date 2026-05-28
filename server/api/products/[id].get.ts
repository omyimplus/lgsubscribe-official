export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('id', id)
    .single()

  if (error) throw createError({ statusCode: 404, message: 'ไม่พบสินค้า' })
  return mapProduct(data)
})
