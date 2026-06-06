import { getHomeYoutubeSettings, toPublicHomeYoutube } from '~~/server/utils/homeYoutubeDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  const settings = await getHomeYoutubeSettings(supabase)
  return toPublicHomeYoutube(settings)
})
