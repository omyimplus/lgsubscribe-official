export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email: string
    password: string
    role?: 'admin' | 'employee'
    fullName?: string
  }>(event)

  if (!body.email?.trim() || !body.password) {
    throw createError({ statusCode: 400, message: 'email และ password จำเป็นต้องมี' })
  }

  if (body.password.length < 6) {
    throw createError({ statusCode: 400, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  }

  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      full_name: body.fullName ?? '',
      role: body.role ?? 'employee',
    },
  })

  if (error) throw createError({ statusCode: 400, message: error.message })

  return mapAuthUserToAdminUser(data.user)
})
