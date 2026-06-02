import type { SubscriptionInquiry } from '~~/shared/types/inquiry'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('subscription_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []) as SubscriptionInquiry[]
})
