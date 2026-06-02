import type { InquiryStatus } from '~~/shared/types/inquiry'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<{ status?: InquiryStatus }>(event)
  if (!body.status || !['new', 'contacted', 'closed'].includes(body.status)) {
    throw createError({ statusCode: 400, message: 'status ไม่ถูกต้อง' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('subscription_inquiries')
    .update({ status: body.status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
