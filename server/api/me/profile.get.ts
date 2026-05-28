import type { CustomerProfile } from '~~/shared/types/customer'

export default defineEventHandler(async (event) => {
  const user = await getAuthUserFromEvent(event)
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  if (!data) {
    const { data: created, error: createErrorRes } = await supabase
      .from('customer_profiles')
      .insert({
        id: user.id,
        email: user.email ?? '',
        full_name: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '',
      })
      .select('*')
      .single()

    if (createErrorRes) {
      throw createError({ statusCode: 400, message: createErrorRes.message })
    }

    return created as CustomerProfile
  }

  return data as CustomerProfile
})
