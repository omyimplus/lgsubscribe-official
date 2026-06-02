export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      main_category:main_categories (
        id,
        name,
        slug
      )
    `)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
