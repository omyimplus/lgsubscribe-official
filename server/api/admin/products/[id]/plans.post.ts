import type { CreatePlanInput } from '~~/shared/types/productPlan'
import { createProductPlan } from '~~/server/utils/productPlansDb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<CreatePlanInput>(event)
  const supabase = useSupabaseAdmin()
  return createProductPlan(supabase, id, body)
})
