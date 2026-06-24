export const LP_CAREERS_DEFAULT_VIDEO_TITLE = 'วิดีโอ Lifestyle Planner'

export type LpCareersPageSettings = {
  slide_image_urls: string[]
  youtube_url: string | null
  video_id: string | null
  video_title: string
  updated_at: string
}

export type LpCareersPagePublic = {
  slide_images: string[]
  video: {
    video_id: string
    title: string
    watch_url: string
  } | null
}

export type LpCareersPageInput = {
  slide_image_urls?: string[]
  youtube_url?: string | null
  video_title?: string
}
