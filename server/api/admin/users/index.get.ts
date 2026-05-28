export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  try {
    const users = await listAllAuthUsers(supabase)
    return users
      .map(mapAuthUserToAdminUser)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  catch (error: any) {
    throw createError({ statusCode: 500, message: error?.message ?? 'โหลดรายชื่อผู้ใช้ไม่สำเร็จ' })
  }
})
