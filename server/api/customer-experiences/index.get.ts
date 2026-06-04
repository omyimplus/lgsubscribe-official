import { customerExperienceListSelect, mapCustomerExperienceRow } from '~~/server/utils/customerExperienceDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('customer_experiences')
    .select(customerExperienceListSelect)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(row => mapCustomerExperienceRow(row))
})
