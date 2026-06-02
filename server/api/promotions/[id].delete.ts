export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()
  const { error } = await supabase.from('promotions').delete().eq('id', id)

  if (error) throw createError({ statusCode: 400, message: error.message })
  return { ok: true }
})
