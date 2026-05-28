export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const supabase = useSupabaseAdmin()

  let q = supabase
    .from('products')
    .select(productSelect)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (query.category_id) q = q.eq('category_id', String(query.category_id))
  if (query.status) q = q.eq('status', String(query.status))

  const { data, error } = await q
  if (error) throw createError({ statusCode: 500, message: error.message })

  return (data ?? []).map(row => mapProduct(row))
})
