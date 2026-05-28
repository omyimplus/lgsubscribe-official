export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ user id' })

  const supabase = useSupabaseAdmin()
  const { error } = await supabase.auth.admin.deleteUser(id)

  if (error) throw createError({ statusCode: 400, message: error.message })

  return { success: true }
})
