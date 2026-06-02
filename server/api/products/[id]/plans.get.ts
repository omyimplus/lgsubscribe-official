import { fetchProductPlans } from '~~/server/utils/productPlansDb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()
  return fetchProductPlans(supabase, id, { activeOnly: true, publishedOnly: true })
})
