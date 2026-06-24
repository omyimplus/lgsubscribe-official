import { getTrustPageSettings } from '~~/server/utils/trustPageDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  return await getTrustPageSettings(supabase)
})
