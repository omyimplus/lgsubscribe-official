import { fetchProductPlans } from '~~/server/utils/productPlansDb'
import { pickStorefrontPlans } from '~~/shared/utils/planDisplay'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()
  const response = await fetchProductPlans(supabase, id, { activeOnly: true, publishedOnly: true })
  const visiblePlans = pickStorefrontPlans(response.plans)

  return {
    ...response,
    plans: visiblePlans,
    default_plan_id: visiblePlans.find(p => p.is_default)?.id
      ?? visiblePlans[0]?.id
      ?? null,
  }
})
