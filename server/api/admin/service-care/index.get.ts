import { listServiceCareVideos } from '~~/server/utils/serviceCareDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  return await listServiceCareVideos(supabase)
})
