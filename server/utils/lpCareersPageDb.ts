import type {
  LpCareersPagePublic,
  LpCareersPageSettings,
} from '~~/shared/types/lpCareersPage'
import {
  LP_CAREERS_DEFAULT_VIDEO_TITLE,
} from '~~/shared/types/lpCareersPage'
import {
  extractYoutubeVideoId,
  youtubeWatchUrl,
} from '~~/shared/utils/youtubeEmbed'

const ROW_ID = 1

type LpCareersPageRow = {
  id: number
  slide_image_urls: string[] | null
  youtube_url: string | null
  video_id: string | null
  video_title: string
  updated_at: string
}

export function normalizeLpCareersSlideUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return []
  return urls
    .map(url => String(url ?? '').trim())
    .filter(Boolean)
}

function mapRow(row: LpCareersPageRow): LpCareersPageSettings {
  return {
    slide_image_urls: normalizeLpCareersSlideUrls(row.slide_image_urls),
    youtube_url: row.youtube_url,
    video_id: row.video_id,
    video_title: row.video_title?.trim() || LP_CAREERS_DEFAULT_VIDEO_TITLE,
    updated_at: row.updated_at,
  }
}

export function toPublicLpCareersPage(row: LpCareersPageSettings | null): LpCareersPagePublic {
  const slide_images = normalizeLpCareersSlideUrls(row?.slide_image_urls)
  const video_id = row?.video_id?.trim() || null

  return {
    slide_images,
    video: video_id
      ? {
          video_id,
          title: row?.video_title?.trim() || LP_CAREERS_DEFAULT_VIDEO_TITLE,
          watch_url: youtubeWatchUrl(video_id),
        }
      : null,
  }
}

const DEFAULT_SETTINGS: LpCareersPageSettings = {
  slide_image_urls: [],
  youtube_url: null,
  video_id: null,
  video_title: LP_CAREERS_DEFAULT_VIDEO_TITLE,
  updated_at: new Date().toISOString(),
}

export async function getLpCareersPageSettings(supabase: ReturnType<typeof useSupabaseAdmin>) {
  const { data, error } = await supabase
    .from('lp_careers_page')
    .select('id, slide_image_urls, youtube_url, video_id, video_title, updated_at')
    .eq('id', ROW_ID)
    .maybeSingle()

  if (error) {
    if (error.code === '42P01' || /lp_careers_page/i.test(error.message)) {
      throw createError({
        statusCode: 503,
        message: 'ยังไม่ได้รัน migration 0049_lp_careers_page.sql บน Supabase',
      })
    }
    throw createError({ statusCode: 500, message: error.message })
  }
  if (!data) return { ...DEFAULT_SETTINGS }
  return mapRow(data as LpCareersPageRow)
}

export async function updateLpCareersPageSettings(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  body: {
    slide_image_urls?: string[]
    youtube_url?: string | null
    video_title?: string
  },
) {
  const current = await getLpCareersPageSettings(supabase)

  const slide_image_urls = body.slide_image_urls !== undefined
    ? normalizeLpCareersSlideUrls(body.slide_image_urls)
    : current.slide_image_urls

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

  const video_title = body.video_title !== undefined
    ? String(body.video_title ?? '').trim() || LP_CAREERS_DEFAULT_VIDEO_TITLE
    : current.video_title

  const { data, error } = await supabase
    .from('lp_careers_page')
    .upsert({
      id: ROW_ID,
      slide_image_urls,
      youtube_url,
      video_id,
      video_title,
    }, { onConflict: 'id' })
    .select('id, slide_image_urls, youtube_url, video_id, video_title, updated_at')
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, message: error?.message ?? 'บันทึกไม่สำเร็จ' })
  }

  return mapRow(data as LpCareersPageRow)
}
