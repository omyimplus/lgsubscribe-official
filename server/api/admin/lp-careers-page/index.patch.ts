import type { LpCareersPageInput } from '~~/shared/types/lpCareersPage'
import { updateLpCareersPageSettings } from '~~/server/utils/lpCareersPageDb'

export default defineEventHandler(async (event) => {
  const body = await readBody<LpCareersPageInput>(event)
  const supabase = useSupabaseAdmin()
  return await updateLpCareersPageSettings(supabase, body)
})
