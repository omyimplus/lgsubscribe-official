import type { Ref, WatchSource } from 'vue'

/** ปรับ <video> ใน HTML ที่ render ด้วย v-html (รวมข้อมูลเก่าก่อน re-import) */
const RICH_HTML_SELECTOR = '.storefront-rich-html, .product-detail-html, .article-body, .faq-body'

function isVideoUrl(url: string) {
  const lower = url.toLowerCase()
  if (/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(lower)) return false
  return /\.(mp4|webm|mov)(\?|$)/i.test(lower) || lower.includes('/video/')
}

function scoreVideoSource(url: string) {
  const lower = url.toLowerCase()
  let score = 0
  if (lower.includes('mobile') || lower.includes('-m.')) score -= 20
  if (lower.includes('desktop') || lower.includes('-d.')) score += 15
  score += Math.min(lower.length / 50, 10)
  return score
}

function pickBestVideoSource(urls: string[]) {
  const unique = [...new Set(urls.filter(Boolean))]
  if (!unique.length) return ''
  if (unique.length === 1) return unique[0]
  return unique.sort((a, b) => scoreVideoSource(b) - scoreVideoSource(a))[0]
}

function collapseVideosInSection(section: ParentNode) {
  const seen = new Set<string>()

  section.querySelectorAll('video').forEach((video) => {
    const sources: string[] = []
    const direct = video.getAttribute('src')?.trim()
    if (direct) sources.push(direct)
    video.querySelectorAll('source').forEach((s) => {
      const src = s.getAttribute('src')?.trim()
      if (src) sources.push(src)
    })

    const best = pickBestVideoSource(sources.filter(u => isVideoUrl(u)))
    if (!best) return

    if (seen.has(best)) {
      const block = video.closest('div') ?? video.parentElement
      video.remove()
      block?.querySelectorAll('img').forEach(img => img.remove())
      return
    }
    seen.add(best)

    let poster = video.getAttribute('poster')?.trim()
    const block = video.parentElement
    block?.querySelectorAll(':scope > img').forEach((img) => {
      const src = img.getAttribute('src')?.trim()
      if (!src || isVideoUrl(src)) return
      if (!poster) poster = src
      img.remove()
    })

    while (video.firstChild) video.removeChild(video.firstChild)
    video.setAttribute('src', best)
    video.setAttribute('controls', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('preload', 'metadata')
    if (poster) video.setAttribute('poster', poster)

    block?.querySelectorAll(':scope > button').forEach(btn => btn.remove())
    block?.querySelectorAll(':scope > div').forEach((div) => {
      if (div.querySelector('button') && !div.querySelector('video')) div.remove()
    })

    video.load()
  })

  section.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img')
    const src = img?.getAttribute('src')
    if (!src) {
      picture.remove()
      return
    }
    const replacement = document.createElement('img')
    replacement.src = src
    replacement.alt = img?.getAttribute('alt') ?? ''
    picture.replaceWith(replacement)
  })
}

function collectRichHtmlSections(root: ParentNode): ParentNode[] {
  const sections = new Set<ParentNode>()
  if (root instanceof Element && root.matches(RICH_HTML_SELECTOR)) {
    sections.add(root)
  }
  root.querySelectorAll(RICH_HTML_SELECTOR).forEach(el => sections.add(el))
  return [...sections]
}

export function fixEmbeddedVideos(root: ParentNode = document) {
  for (const section of collectRichHtmlSections(root)) {
    collapseVideosInSection(section)
  }
}

/** รันหลัง v-html อัปเดต — ส่ง ref ของ element ที่มี class article-body / product-detail-html */
export function useEmbeddedVideos(
  rootRef: Ref<HTMLElement | null | undefined>,
  contentWatch?: WatchSource<unknown>,
) {
  function run() {
    nextTick(() => {
      if (rootRef.value) fixEmbeddedVideos(rootRef.value)
    })
  }

  onMounted(run)
  watch(rootRef, run)
  if (contentWatch !== undefined) {
    watch(contentWatch, run)
  }
}

export function useEmbeddedVideosAfterMount() {
  onMounted(() => {
    nextTick(() => fixEmbeddedVideos(document))
  })
}
