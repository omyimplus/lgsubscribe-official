import type { CustomerProfile } from '~~/shared/types/customer'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return (data ?? []) as CustomerProfile[]
})
