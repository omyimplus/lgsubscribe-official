import { parse, type HTMLElement } from 'node-html-parser'

const LG_ORIGIN = 'https://www.lg.com'

export function normalizeMediaUrl(value: string | null | undefined) {
  const raw = String(value ?? '').trim()
  if (!raw || raw.startsWith('data:')) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith('//')) return `https:${raw}`
  if (raw.startsWith('/')) return `${LG_ORIGIN}${raw}`
  return `${LG_ORIGIN}/${raw}`
}

export function isVideoMediaUrl(url: string) {
  const lower = url.toLowerCase()
  if (/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(lower)) return false
  return /\.(mp4|webm|mov)(\?|$)/i.test(lower) || lower.includes('/video/')
}

function scoreVideoSource(url: string) {
  const lower = url.toLowerCase()
  let score = 0
  if (lower.includes('mobile') || lower.includes('-m.') || lower.includes('_m.')) score -= 20
  if (lower.includes('desktop') || lower.includes('-d.') || lower.includes('_d.')) score += 15
  if (lower.includes('1080') || lower.includes('4k') || lower.includes('uhd')) score += 8
  score += Math.min(lower.length / 50, 10)
  return score
}

/** เลือก mp4 หลัก 1 ไฟล์จากหลาย <source> ของ LG (มักมี mobile + desktop) */
export function pickBestVideoSource(urls: string[]) {
  const unique = [...new Set(urls.map(normalizeMediaUrl).filter(u => u && isVideoMediaUrl(u)))]
  if (!unique.length) return ''
  if (unique.length === 1) return unique[0]
  return unique.sort((a, b) => scoreVideoSource(b) - scoreVideoSource(a))[0]
}

function collectVideoSourcesFromElement(video: HTMLElement) {
  const urls: string[] = []
  const direct = normalizeMediaUrl(video.getAttribute('src'))
  if (direct) urls.push(direct)
  for (const source of video.querySelectorAll('source')) {
    const src = normalizeMediaUrl(source.getAttribute('src'))
    if (src) urls.push(src)
  }
  return pickBestVideoSource(urls)
}

function firstUrlFromSrcset(srcset: string | null | undefined) {
  const raw = String(srcset ?? '').trim()
  if (!raw) return ''
  return raw.split(',')[0]?.trim().split(/\s+/)[0] ?? ''
}

function resolvePictureImgSrc(picture: HTMLElement) {
  const img = picture.querySelector('img')
  let src = normalizeMediaUrl(img?.getAttribute('src'))
  if (src) return src

  for (const attr of ['data-src', 'data-lazy-src', 'data-original']) {
    src = normalizeMediaUrl(img?.getAttribute(attr))
    if (src) return src
  }

  for (const source of picture.querySelectorAll('source')) {
    src = normalizeMediaUrl(source.getAttribute('src'))
    if (src) return src
    src = normalizeMediaUrl(firstUrlFromSrcset(source.getAttribute('srcset')))
    if (src) return src
  }

  return ''
}

/** LG ใช้ data-src / srcset — ย้ายมาเป็น src ก่อน strip attribute */
export function promoteLazyImageSources(wrapper: HTMLElement) {
  for (const img of wrapper.querySelectorAll('img')) {
    if (normalizeMediaUrl(img.getAttribute('src'))) continue
    for (const attr of ['data-src', 'data-lazy-src', 'data-original', 'data-srcset']) {
      const candidate = attr === 'data-srcset'
        ? firstUrlFromSrcset(img.getAttribute(attr))
        : img.getAttribute(attr)
      const src = normalizeMediaUrl(candidate)
      if (src) {
        img.setAttribute('src', src)
        break
      }
    }
  }
}

function collapsePictureElements(wrapper: HTMLElement) {
  for (const picture of [...wrapper.querySelectorAll('picture')]) {
    const img = picture.querySelector('img')
    const src = resolvePictureImgSrc(picture)
    if (!src) {
      picture.remove()
      continue
    }
    const replacement = parse('<img />').firstChild as HTMLElement
    replacement.setAttribute('src', src)
    if (img?.getAttribute('alt')) replacement.setAttribute('alt', img.getAttribute('alt')!)
    picture.replaceWith(replacement)
  }
}

/** รูป preview ที่อยู่ถัดจาก <video> ใน wrapper เดียวกันเท่านั้น (ไม่ลบรูป feature ทั้ง section) */
function directSiblingImgs(video: HTMLElement) {
  const parent = video.parentElement
  if (!parent) return []
  return [...parent.children].filter(
    child => child.tagName?.toLowerCase() === 'img',
  ) as HTMLElement[]
}

function directSiblingVideos(video: HTMLElement) {
  const parent = video.parentElement
  if (!parent) return []
  return [...parent.children].filter(
    child => child.tagName?.toLowerCase() === 'video',
  ) as HTMLElement[]
}

function applySingleVideo(video: HTMLElement, src: string, poster?: string) {
  video.innerHTML = ''
  video.setAttribute('src', src)
  video.setAttribute('controls', '')
  video.setAttribute('playsinline', '')
  video.setAttribute('preload', 'metadata')
  video.removeAttribute('loop')
  if (poster) video.setAttribute('poster', poster)
  else video.removeAttribute('poster')
}

/**
 * รวมบล็อก media ของ LG ให้เหลือวิดีโอเดียว + poster (ไม่แสดงรูป preview ซ้ำ 3 ชั้น)
 */
export function collapseLgMediaBlocks(wrapper: HTMLElement) {
  promoteLazyImageSources(wrapper)
  collapsePictureElements(wrapper)

  const seenVideoSrc = new Set<string>()

  for (const video of [...wrapper.querySelectorAll('video')]) {
    const bestSrc = collectVideoSourcesFromElement(video)
    if (!bestSrc) {
      video.remove()
      continue
    }

    if (seenVideoSrc.has(bestSrc)) {
      video.remove()
      directSiblingImgs(video).forEach(img => img.remove())
      continue
    }
    seenVideoSrc.add(bestSrc)

    let poster = normalizeMediaUrl(video.getAttribute('poster'))
    for (const img of directSiblingImgs(video)) {
      const src = normalizeMediaUrl(img.getAttribute('src'))
      if (!src || isVideoMediaUrl(src)) continue
      if (!poster) poster = src
      img.remove()
    }

    const siblings = directSiblingVideos(video)
    const primary = siblings[0] ?? video
    for (const extra of siblings.slice(1)) extra.remove()

    applySingleVideo(primary, bestSrc, poster || undefined)

    const parent = primary.parentElement
    parent?.querySelectorAll(':scope > button').forEach(btn => btn.remove())
    parent?.querySelectorAll(':scope > div').forEach((div) => {
      if (div.querySelector('button') && !div.querySelector('video')) div.remove()
    })
  }
}

/** ดึง URL วิดีโอหลัก 1 รายการต่อ <video> สำหรับ mirror */
export function extractBestVideoUrlsFromHtml(html: string | null | undefined) {
  if (!html?.trim()) return []
  const root = parse(`<div data-root="1">${html}</div>`, { comment: false })
  const wrapper = root.querySelector('div[data-root]') as HTMLElement | null
  if (!wrapper) return []

  const urls: string[] = []
  for (const video of wrapper.querySelectorAll('video')) {
    const best = collectVideoSourcesFromElement(video)
    if (best) urls.push(best)
  }
  return urls
}
