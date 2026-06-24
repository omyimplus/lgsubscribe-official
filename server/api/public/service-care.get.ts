import { toPublicServiceCarePage, listServiceCareVideos } from '~~/server/utils/serviceCareDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  const rows = await listServiceCareVideos(supabase)
  return toPublicServiceCarePage(rows)
})
