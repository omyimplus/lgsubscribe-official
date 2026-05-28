import type { CustomerProfile, CustomerProfileInput } from '~~/shared/types/customer'

export default defineEventHandler(async (event) => {
  const user = await getAuthUserFromEvent(event)
  const body = await readBody<CustomerProfileInput>(event)
  const supabase = useSupabaseAdmin()

  const payload = {
    id: user.id,
    email: user.email ?? '',
    full_name: body.full_name?.trim() ?? '',
    phone: body.phone?.trim() ?? '',
    line_id: body.line_id?.trim() ?? '',
    contact_note: body.contact_note?.trim() ?? '',
    marketing_consent: body.marketing_consent ?? false,
  }

  const { data, error } = await supabase
    .from('customer_profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  return data as CustomerProfile
})
