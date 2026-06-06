import type { HomeYoutubePublic, HomeYoutubeSettings } from '~~/shared/types/homeYoutube'
import {
  clampYoutubeVolume,
  extractYoutubeVideoId,
  youtubeEmbedUrl,
  youtubeWatchUrl,
} from '~~/shared/utils/youtubeEmbed'

const ROW_ID = 1

type HomeYoutubeRow = {
  id: number
  youtube_url: string | null
  video_id: string | null
  title: string
  is_active: boolean
  autoplay: boolean
  default_volume: number
  updated_at: string
}

function mapRow(row: HomeYoutubeRow): HomeYoutubeSettings {
  return {
    youtube_url: row.youtube_url,
    video_id: row.video_id,
    title: row.title,
    is_active: row.is_active,
    autoplay: row.autoplay ?? false,
    default_volume: clampYoutubeVolume(row.default_volume),
    updated_at: row.updated_at,
  }
}

export function toPublicHomeYoutube(row: HomeYoutubeSettings | null): HomeYoutubePublic | null {
  if (!row?.is_active || !row.video_id) return null
  const embed_url = youtubeEmbedUrl(row.video_id, { autoplay: row.autoplay })
  if (!embed_url) return null
  return {
    video_id: row.video_id,
    title: row.title?.trim() || 'วิดีโอจาก LG Subscribe',
    embed_url,
    watch_url: youtubeWatchUrl(row.video_id),
    autoplay: row.autoplay,
    default_volume: clampYoutubeVolume(row.default_volume),
  }
}

export async function getHomeYoutubeSettings(supabase: ReturnType<typeof useSupabaseAdmin>) {
  const { data, error } = await supabase
    .from('home_youtube')
    .select('id, youtube_url, video_id, title, is_active, autoplay, default_volume, updated_at')
    .eq('id', ROW_ID)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) {
    return {
      youtube_url: null,
      video_id: null,
      title: 'วิดีโอจาก LG Subscribe',
      is_active: false,
      autoplay: false,
      default_volume: 40,
      updated_at: new Date().toISOString(),
    } satisfies HomeYoutubeSettings
  }
  return mapRow(data as HomeYoutubeRow)
}

export async function updateHomeYoutubeSettings(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  body: { youtube_url?: string | null, title?: string, is_active?: boolean, autoplay?: boolean, default_volume?: number },
) {
  const current = await getHomeYoutubeSettings(supabase)
  const youtube_url = body.youtube_url !== undefined
    ? String(body.youtube_url ?? '').trim() || null
    : current.youtube_url
  const video_id = youtube_url ? extractYoutubeVideoId(youtube_url) : null

  if (youtube_url && !video_id) {
    throw createError({
      statusCode: 400,
      message: 'ลิงก์ YouTube ไม่ถูกต้อง — ใส่ URL แบบ youtube.com/watch?v=... หรือ youtu.be/...',
    })
  }

  const title = body.title !== undefined
    ? String(body.title ?? '').trim() || 'วิดีโอจาก LG Subscribe'
    : current.title

  const is_active = body.is_active !== undefined ? Boolean(body.is_active) : current.is_active
  const autoplay = body.autoplay !== undefined ? Boolean(body.autoplay) : current.autoplay
  const default_volume = body.default_volume !== undefined
    ? clampYoutubeVolume(body.default_volume)
    : clampYoutubeVolume(current.default_volume)

  if (is_active && !video_id) {
    throw createError({
      statusCode: 400,
      message: 'เปิดแสดงบนหน้าแรกไม่ได้ — กรุณาใส่ลิงก์ YouTube ที่ถูกต้องก่อน',
    })
  }

  const { data, error } = await supabase
    .from('home_youtube')
    .upsert({
      id: ROW_ID,
      youtube_url,
      video_id,
      title,
      is_active,
      autoplay,
      default_volume,
    }, { onConflict: 'id' })
    .select('id, youtube_url, video_id, title, is_active, autoplay, default_volume, updated_at')
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, message: error?.message ?? 'บันทึกไม่สำเร็จ' })
  }

  return mapRow(data as HomeYoutubeRow)
}
