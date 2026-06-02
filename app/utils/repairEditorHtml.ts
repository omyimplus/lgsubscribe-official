const LG_ORIGIN = 'https://www.lg.com'

function normalizeUrl(url: string | null | undefined) {
  const raw = String(url ?? '').trim()
  if (!raw || raw.startsWith('data:')) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith('//')) return `https:${raw}`
  if (raw.startsWith('/')) return `${LG_ORIGIN}${raw}`
  return raw
}

function firstFromSrcset(srcset: string | null | undefined) {
  const raw = String(srcset ?? '').trim()
  if (!raw) return ''
  return raw.split(',')[0]?.trim().split(/\s+/)[0] ?? ''
}

/** ซ่อมรูปใน HTML สำหรับ TinyMCE (ข้อมูล import เก่าที่เหลือ picture / data-src) */
export function repairEditorHtmlImages(html: string | null | undefined) {
  if (!html?.trim()) return html ?? ''
  if (typeof document === 'undefined') return html

  const wrap = document.createElement('div')
  wrap.innerHTML = html

  wrap.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img')
    let src = normalizeUrl(img?.getAttribute('src'))
    if (!src) {
      for (const attr of ['data-src', 'data-lazy-src', 'data-original']) {
        src = normalizeUrl(img?.getAttribute(attr))
        if (src) break
      }
    }
    if (!src) {
      for (const source of picture.querySelectorAll('source')) {
        src = normalizeUrl(source.getAttribute('src')) || normalizeUrl(firstFromSrcset(source.getAttribute('srcset')))
        if (src) break
      }
    }
    if (!src) return

    const replacement = document.createElement('img')
    replacement.setAttribute('src', src)
    if (img?.getAttribute('alt')) replacement.setAttribute('alt', img.getAttribute('alt')!)
    picture.replaceWith(replacement)
  })

  wrap.querySelectorAll('img').forEach((img) => {
    let src = normalizeUrl(img.getAttribute('src'))
    if (!src) {
      for (const attr of ['data-src', 'data-lazy-src', 'data-original']) {
        src = normalizeUrl(img.getAttribute(attr))
        if (src) break
      }
    }
    if (src) img.setAttribute('src', src)
  })

  return wrap.innerHTML
}
