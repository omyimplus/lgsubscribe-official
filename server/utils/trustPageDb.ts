import type { TrustPagePublic, TrustPageSettings } from '~~/shared/types/trustPage'
import {
  TRUST_PAGE_DEFAULT_VIDEO_TITLE,
} from '~~/shared/types/trustPage'
import { hasRichHtmlContent } from '~~/shared/utils/richHtmlContent'
import {
  extractYoutubeVideoId,
  youtubeWatchUrl,
} from '~~/shared/utils/youtubeEmbed'

const ROW_ID = 1

type TrustPageRow = {
  id: number
  body_html: string | null
  slide_image_urls: string[] | null
  youtube_url: string | null
  video_id: string | null
  video_title: string
  updated_at: string
}

export function normalizeTrustSlideUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return []
  return urls
    .map(url => String(url ?? '').trim())
    .filter(Boolean)
}

function mapRow(row: TrustPageRow): TrustPageSettings {
  return {
    body_html: row.body_html ?? '',
    slide_image_urls: normalizeTrustSlideUrls(row.slide_image_urls),
    youtube_url: row.youtube_url,
    video_id: row.video_id,
    video_title: row.video_title?.trim() || TRUST_PAGE_DEFAULT_VIDEO_TITLE,
    updated_at: row.updated_at,
  }
}

export function toPublicTrustPage(row: TrustPageSettings | null): TrustPagePublic {
  const body_html = row?.body_html ?? ''
  const slide_images = normalizeTrustSlideUrls(row?.slide_image_urls)
  const video_id = row?.video_id?.trim() || null

  return {
    body_html: hasRichHtmlContent(body_html) ? body_html : '',
    slide_images,
    video: video_id
      ? {
          video_id,
          title: row?.video_title?.trim() || TRUST_PAGE_DEFAULT_VIDEO_TITLE,
          watch_url: youtubeWatchUrl(video_id),
        }
      : null,
  }
}

const DEFAULT_SETTINGS: TrustPageSettings = {
  body_html: '',
  slide_image_urls: [],
  youtube_url: null,
  video_id: null,
  video_title: TRUST_PAGE_DEFAULT_VIDEO_TITLE,
  updated_at: new Date().toISOString(),
}

export async function getTrustPageSettings(supabase: ReturnType<typeof useSupabaseAdmin>) {
  const { data, error } = await supabase
    .from('trust_page')
    .select('id, body_html, slide_image_urls, youtube_url, video_id, video_title, updated_at')
    .eq('id', ROW_ID)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) return { ...DEFAULT_SETTINGS }
  return mapRow(data as TrustPageRow)
}

export async function updateTrustPageSettings(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  body: {
    body_html?: string | null
    slide_image_urls?: string[]
    youtube_url?: string | null
    video_title?: string
  },
) {
  const current = await getTrustPageSettings(supabase)

  const body_html = body.body_html !== undefined
    ? String(body.body_html ?? '')
    : current.body_html

  const slide_image_urls = body.slide_image_urls !== undefined
    ? normalizeTrustSlideUrls(body.slide_image_urls)
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
    ? String(body.video_title ?? '').trim() || TRUST_PAGE_DEFAULT_VIDEO_TITLE
    : current.video_title

  const { data, error } = await supabase
    .from('trust_page')
    .upsert({
      id: ROW_ID,
      body_html,
      slide_image_urls,
      youtube_url,
      video_id,
      video_title,
    }, { onConflict: 'id' })
    .select('id, body_html, slide_image_urls, youtube_url, video_id, video_title, updated_at')
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, message: error?.message ?? 'บันทึกไม่สำเร็จ' })
  }

  return mapRow(data as TrustPageRow)
}
