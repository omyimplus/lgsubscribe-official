/** ตั้งสถานะสินค้าทั้งหมดเป็น published (แสดงบนเว็บไซต์สาธารณะ) */
export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('products')
    .update({ status: 'published', is_active: true })
    .not('id', 'is', null)
    .select('id')

  if (error) throw createError({ statusCode: 500, message: error.message })

  return {
    updated: data?.length ?? 0,
  }
})
