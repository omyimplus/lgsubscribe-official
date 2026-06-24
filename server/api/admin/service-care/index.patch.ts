import type { ServiceCareVideoInput } from '~~/shared/types/serviceCare'
import { updateServiceCareVideos } from '~~/server/utils/serviceCareDb'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ items?: ServiceCareVideoInput[] }>(event)
  const items = Array.isArray(body.items) ? body.items : []
  const supabase = useSupabaseAdmin()
  return await updateServiceCareVideos(supabase, items)
})
