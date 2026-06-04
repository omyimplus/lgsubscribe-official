import { mapCustomerExperienceRow } from '~~/server/utils/customerExperienceDb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('customer_experiences')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) throw createError({ statusCode: 404, message: 'ไม่พบรายการ' })
  return mapCustomerExperienceRow(data)
})
