export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(row => mapProduct(row))
})
