import { getTrustPageSettings, toPublicTrustPage } from '~~/server/utils/trustPageDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  const settings = await getTrustPageSettings(supabase)
  return toPublicTrustPage(settings)
})
