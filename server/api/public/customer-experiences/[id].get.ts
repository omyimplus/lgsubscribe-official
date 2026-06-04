import { mapCustomerExperienceRow } from '~~/server/utils/customerExperienceDb'

/** กิจกรรมเดียว (เฉพาะที่เปิดแสดง) */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('customer_experiences')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) throw createError({ statusCode: 404, message: 'ไม่พบกิจกรรม' })
  return mapCustomerExperienceRow(data)
})
