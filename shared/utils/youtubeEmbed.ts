/** แปลง URL / ID YouTube เป็น video id (11 ตัวอักษร) */
import { HOME_YOUTUBE_DEFAULT_VOLUME } from '~~/shared/types/homeYoutube'

export { HOME_YOUTUBE_DEFAULT_VOLUME }
export function extractYoutubeVideoId(input: string | null | undefined): string | null {
  const trimmed = String(input ?? '').trim()
  if (!trimmed) return null
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const fromQuery = url.searchParams.get('v')
      if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) return fromQuery

      const parts = url.pathname.split('/').filter(Boolean)
      const embedIdx = parts.indexOf('embed')
      if (embedIdx >= 0 && parts[embedIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[embedIdx + 1]!)) {
        return parts[embedIdx + 1]!
      }
      const shortsIdx = parts.indexOf('shorts')
      if (shortsIdx >= 0 && parts[shortIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[shortsIdx + 1]!)) {
        return parts[shortsIdx + 1]!
      }
    }
  }
  catch {
    return null
  }

  return null
}

export function clampYoutubeVolume(value: number | null | undefined) {
  const n = Number(value)
  if (!Number.isFinite(n)) return HOME_YOUTUBE_DEFAULT_VOLUME
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function youtubeEmbedUrl(videoId: string, options?: { autoplay?: boolean }) {
  const id = extractYoutubeVideoId(videoId)
  if (!id) return ''
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
  })
  if (options?.autoplay) {
    params.set('autoplay', '1')
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`
}

export function youtubeWatchUrl(videoId: string) {
  const id = extractYoutubeVideoId(videoId)
  if (!id) return ''
  return `https://www.youtube.com/watch?v=${id}`
}
