export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email: string
    password: string
    fullName?: string
    phone?: string
    lineId?: string
    marketingConsent?: boolean
  }>(event)

  if (!body.email?.trim() || !body.password) {
    throw createError({ statusCode: 400, message: 'กรุณากรอกอีเมลและรหัสผ่าน' })
  }

  if (body.password.length < 6) {
    throw createError({ statusCode: 400, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  }

  const supabase = useSupabaseAdmin()
  const email = body.email.trim().toLowerCase()

  const { data: created, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      role: 'customer',
      full_name: body.fullName?.trim() ?? '',
    },
  })

  if (createUserError) {
    const msg = createUserError.message.toLowerCase()
    if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
      throw createError({
        statusCode: 409,
        message: 'อีเมลนี้มีในระบบแล้ว กรุณาเข้าสู่ระบบแทน',
      })
    }
    throw createError({ statusCode: 400, message: createUserError.message })
  }

  const user = created.user
  if (!user) {
    throw createError({ statusCode: 500, message: 'สร้างบัญชีไม่สำเร็จ' })
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('customer_profiles')
    .upsert({
      id: user.id,
      email,
      full_name: body.fullName?.trim() ?? '',
      phone: body.phone?.trim() ?? '',
      line_id: body.lineId?.trim() ?? '',
      contact_note: '',
      marketing_consent: body.marketingConsent ?? false,
    }, { onConflict: 'id' })
    .select('id, email')
    .single()

  if (profileError) {
    const message = profileError.message.toLowerCase().includes('customer_profiles')
      ? 'ยังไม่พบตาราง customer_profiles กรุณารัน migration 0011_customer_profiles.sql'
      : profileError.message
    throw createError({ statusCode: 400, message })
  }

  if (!profileRow?.id) {
    throw createError({ statusCode: 500, message: 'บันทึกข้อมูลลูกค้าไม่สำเร็จ' })
  }

  return { success: true }
})
