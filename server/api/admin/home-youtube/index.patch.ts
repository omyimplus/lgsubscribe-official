import { updateHomeYoutubeSettings } from '~~/server/utils/homeYoutubeDb'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    youtube_url?: string | null
    title?: string
    is_active?: boolean
    autoplay?: boolean
    default_volume?: number
  }>(event)
  const supabase = useSupabaseAdmin()
  return updateHomeYoutubeSettings(supabase, body ?? {})
})
