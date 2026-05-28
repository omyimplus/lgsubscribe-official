export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ user id' })

  const body = await readBody<{
    fullName?: string
    role?: 'admin' | 'employee'
    password?: string
  }>(event)

  const supabase = useSupabaseAdmin()
  const { data: existing, error: fetchError } = await supabase.auth.admin.getUserById(id)

  if (fetchError) throw createError({ statusCode: 404, message: fetchError.message })

  const meta = { ...(existing.user.user_metadata ?? {}) }

  if (body.fullName !== undefined) meta.full_name = body.fullName
  if (body.role !== undefined) meta.role = body.role

  const update: { password?: string, user_metadata: Record<string, unknown> } = {
    user_metadata: meta,
  }

  if (body.password?.trim()) {
    if (body.password.length < 6) {
      throw createError({ statusCode: 400, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
    }
    update.password = body.password
  }

  const { data, error } = await supabase.auth.admin.updateUserById(id, update)

  if (error) throw createError({ statusCode: 400, message: error.message })

  return mapAuthUserToAdminUser(data.user)
})
