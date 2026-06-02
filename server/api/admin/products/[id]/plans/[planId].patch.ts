import type { UpdatePlanInput } from '~~/shared/types/productPlan'
import { updateProductPlan } from '~~/server/utils/productPlansDb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const planId = getRouterParam(event, 'planId')
  if (!id || !planId) throw createError({ statusCode: 400, message: 'ต้องระบุ id และ planId' })

  const body = await readBody<UpdatePlanInput>(event)
  const supabase = useSupabaseAdmin()
  return updateProductPlan(supabase, id, planId, body)
})
