import { getLpCareersPageSettings } from '~~/server/utils/lpCareersPageDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  return await getLpCareersPageSettings(supabase)
})
