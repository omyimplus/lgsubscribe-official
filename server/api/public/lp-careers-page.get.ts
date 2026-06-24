import { getLpCareersPageSettings, toPublicLpCareersPage } from '~~/server/utils/lpCareersPageDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  const settings = await getLpCareersPageSettings(supabase)
  return toPublicLpCareersPage(settings)
})
