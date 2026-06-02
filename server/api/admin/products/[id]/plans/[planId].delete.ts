import { deleteProductPlan } from '~~/server/utils/productPlansDb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const planId = getRouterParam(event, 'planId')
  if (!id || !planId) throw createError({ statusCode: 400, message: 'ต้องระบุ id และ planId' })

  const query = getQuery(event)
  const hard = !(query.hard === '0' || query.hard === 'false')

  const supabase = useSupabaseAdmin()
  return deleteProductPlan(supabase, id, planId, { hard })
})
