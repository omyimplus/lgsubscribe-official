export default defineEventHandler(async (event) => {
  const itemId = getRouterParam(event, 'itemId')
  if (!itemId) throw createError({ statusCode: 400, message: 'ต้องระบุ item id' })

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('import_products')
    .select('*')
    .eq('id', itemId)
    .single()

  if (error) throw createError({ statusCode: 404, message: error.message })
  return data
})
