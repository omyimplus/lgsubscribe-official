export const TRUST_PAGE_DEFAULT_VIDEO_TITLE = 'วิดีโอความน่าเชื่อถือ'

/** รูปใบรับรอง Kapook — แสดงคงที่บนหน้าร้าน */
export const TRUST_KAPOOK_CERT_IMAGE = '/images/kapook-cer.webp'

export type TrustPageSettings = {
  body_html: string
  slide_image_urls: string[]
  youtube_url: string | null
  video_id: string | null
  video_title: string
  updated_at: string
}

export type TrustPagePublic = {
  body_html: string
  slide_images: string[]
  video: {
    video_id: string
    title: string
    watch_url: string
  } | null
}

export type TrustPageInput = {
  body_html?: string | null
  slide_image_urls?: string[]
  youtube_url?: string | null
  video_title?: string
}
