import type {
  ServiceCarePagePublic,
  ServiceCareSlug,
  ServiceCareVideoInput,
  ServiceCareVideoPublic,
  ServiceCareVideoSettings,
} from '~~/shared/types/serviceCare'
import {
  SERVICE_CARE_CATALOG,
  SERVICE_CARE_SECTION_TITLE,
  serviceCareFullLabel,
} from '~~/shared/types/serviceCare'
import {
  extractYoutubeVideoId,
  youtubeWatchUrl,
} from '~~/shared/utils/youtubeEmbed'

type ServiceCareRow = {
  slug: string
  sort_order: number
  label_th: string
  youtube_url: string | null
  video_id: string | null
  updated_at: string
}

const VALID_SLUGS = new Set(SERVICE_CARE_CATALOG.map(item => item.slug))

function isServiceCareSlug(value: string): value is ServiceCareSlug {
  return VALID_SLUGS.has(value as ServiceCareSlug)
}

function mapRow(row: ServiceCareRow): ServiceCareVideoSettings {
  return {
    slug: row.slug as ServiceCareSlug,
    sort_order: row.sort_order,
    label_th: row.label_th,
    youtube_url: row.youtube_url,
    video_id: row.video_id,
    updated_at: row.updated_at,
  }
}

function toPublicItem(row: ServiceCareVideoSettings): ServiceCareVideoPublic {
  const video_id = row.video_id?.trim() || null
  return {
    slug: row.slug,
    sort_order: row.sort_order,
    label: row.label_th,
    full_label: serviceCareFullLabel(row.label_th),
    video: video_id
      ? {
          video_id,
          watch_url: youtubeWatchUrl(video_id),
        }
      : null,
  }
}

export function toPublicServiceCarePage(rows: ServiceCareVideoSettings[]): ServiceCarePagePublic {
  return {
    title: SERVICE_CARE_SECTION_TITLE,
    items: rows
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(toPublicItem),
  }
}

export async function listServiceCareVideos(supabase: ReturnType<typeof useSupabaseAdmin>) {
  const { data, error } = await supabase
    .from('service_care_videos')
    .select('slug, sort_order, label_th, youtube_url, video_id, updated_at')
    .order('sort_order', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  const bySlug = new Map((data as ServiceCareRow[] | null ?? []).map(row => [row.slug, mapRow(row)]))

  return SERVICE_CARE_CATALOG.map((item) => {
    const row = bySlug.get(item.slug)
    if (row) return row
    return {
      slug: item.slug,
      sort_order: item.sort_order,
      label_th: item.label_th,
      youtube_url: null,
      video_id: null,
      updated_at: new Date(0).toISOString(),
    } satisfies ServiceCareVideoSettings
  })
}

export async function updateServiceCareVideos(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  items: ServiceCareVideoInput[],
) {
  const current = await listServiceCareVideos(supabase)
  const currentBySlug = new Map(current.map(item => [item.slug, item]))
  const updates: ServiceCareRow[] = []

  for (const input of items) {
    const slug = String(input.slug ?? '').trim()
    if (!isServiceCareSlug(slug)) {
      throw createError({ statusCode: 400, message: `หมวดไม่ถูกต้อง: ${slug || '(ว่าง)'}` })
    }

    const existing = currentBySlug.get(slug)
    if (!existing) {
      throw createError({ statusCode: 400, message: `ไม่พบหมวด: ${slug}` })
    }

    const youtube_url = input.youtube_url !== undefined
      ? String(input.youtube_url ?? '').trim() || null
      : existing.youtube_url

    const video_id = youtube_url ? extractYoutubeVideoId(youtube_url) : null

    if (youtube_url && !video_id) {
      throw createError({
        statusCode: 400,
        message: `ลิงก์ YouTube ไม่ถูกต้องสำหรับ ${existing.label_th} — ใส่ URL แบบ youtube.com/watch?v=... หรือ youtu.be/...`,
      })
    }

    updates.push({
      slug,
      sort_order: existing.sort_order,
      label_th: existing.label_th,
      youtube_url,
      video_id,
      updated_at: new Date().toISOString(),
    })
  }

  if (!updates.length) {
    return current
  }

  const { data, error } = await supabase
    .from('service_care_videos')
    .upsert(updates, { onConflict: 'slug' })
    .select('slug, sort_order, label_th, youtube_url, video_id, updated_at')

  if (error) throw createError({ statusCode: 500, message: error.message })

  const updatedBySlug = new Map((data as ServiceCareRow[]).map(row => [row.slug, mapRow(row)]))

  return SERVICE_CARE_CATALOG.map((item) => {
    const row = updatedBySlug.get(item.slug) ?? currentBySlug.get(item.slug)
    return row!
  })
}
