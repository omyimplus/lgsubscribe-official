export const HOME_YOUTUBE_DEFAULT_VOLUME = 40

export type HomeYoutubeSettings = {
  youtube_url: string | null
  video_id: string | null
  title: string
  is_active: boolean
  autoplay: boolean
  default_volume: number
  updated_at: string
}

export type HomeYoutubePublic = {
  video_id: string
  title: string
  embed_url: string
  watch_url: string
  autoplay: boolean
  default_volume: number
}

export type HomeYoutubeInput = {
  youtube_url?: string | null
  title?: string
  is_active?: boolean
  autoplay?: boolean
  default_volume?: number
}
