import type { LpApplicationStatus } from '~~/shared/types/lpApplication'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<{ status?: LpApplicationStatus }>(event)
  if (!body.status || !['new', 'contacted', 'closed'].includes(body.status)) {
    throw createError({ statusCode: 400, message: 'status ไม่ถูกต้อง' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('lp_applications')
    .update({ status: body.status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
