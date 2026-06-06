import { getHomeYoutubeSettings } from '~~/server/utils/homeYoutubeDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  return getHomeYoutubeSettings(supabase)
})
