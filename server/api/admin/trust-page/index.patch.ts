import type { TrustPageInput } from '~~/shared/types/trustPage'
import { updateTrustPageSettings } from '~~/server/utils/trustPageDb'

export default defineEventHandler(async (event) => {
  const body = await readBody<TrustPageInput>(event)
  const supabase = useSupabaseAdmin()
  return await updateTrustPageSettings(supabase, body)
})
