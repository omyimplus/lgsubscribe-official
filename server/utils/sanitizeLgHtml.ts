import { parse, type HTMLElement } from 'node-html-parser'
import { collapseLgMediaBlocks, promoteLazyImageSources } from './lgMediaBlocks'

export type SanitizeLgHtmlMode = 'minimal' | 'standard' | 'light'

const LG_ORIGIN = 'https://www.lg.com'

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

const TAGS_STANDARD = new Set([
  'a', 'b', 'blockquote', 'br', 'div', 'em', 'figcaption', 'figure',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'i', 'img', 'li', 'ol', 'p', 'picture',
  'source', 'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr',
  'u', 'ul', 'video',
])

const TAGS_LIGHT = new Set([
  ...TAGS_STANDARD,
  'article', 'button', 'caption', 'dl', 'dt', 'dd', 'footer', 'header',
  'iframe', 'main', 'nav', 'section', 'sub', 'sup', 'time',
])

const CLASS_WHITELIST = new Set([
  'product-key-features',
  'faq-list',
  'faq-item',
])

const DROP_TAGS = new Set([
  'script', 'style', 'noscript', 'link', 'meta', 'base', 'template',
])

function normalizeMediaUrl(value: string | undefined) {
  if (!value) return value
  const trimmed = value.trim()
  if (!trimmed || trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('/')) return `${LG_ORIGIN}${trimmed}`
  return trimmed
}

function escapeHtmlText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function filterClassAttr(value: string) {
  const kept = value
    .split(/\s+/)
    .map(c => c.trim())
    .filter(c => CLASS_WHITELIST.has(c))
  return kept.length ? kept.join(' ') : null
}

function keepAttribute(tag: string, name: string, value: string) {
  const attr = name.toLowerCase()
  if (attr.startsWith('on') || attr === 'style' || attr === 'id') return null
  if (attr.startsWith('data-') || attr.startsWith('aria-') || attr === 'role') return null

  if (attr === 'class') {
    const classes = filterClassAttr(value)
    return classes ? { name: 'class', value: classes } : null
  }

  if (attr === 'href' || attr === 'src' || attr === 'poster') {
    return { name: attr, value: normalizeMediaUrl(value) ?? value }
  }

  const allowed = [
    'alt', 'title', 'colspan', 'rowspan', 'width', 'height', 'controls', 'type',
    'playsinline', 'loop', 'muted', 'preload', 'target', 'rel',
  ]
  if (!allowed.includes(attr)) return null
  return { name: attr, value }
}

function applyCleanAttributes(el: HTMLElement) {
  const tag = el.tagName?.toLowerCase() ?? ''
  const attrs = { ...el.attributes }
  for (const name of Object.keys(attrs)) {
    el.removeAttribute(name)
  }
  for (const [name, value] of Object.entries(attrs)) {
    const kept = keepAttribute(tag, name, value)
    if (kept) el.setAttribute(kept.name, kept.value)
  }
}

function unwrapElement(el: HTMLElement) {
  const parent = el.parentNode as HTMLElement | null
  if (!parent) return
  const index = parent.childNodes.indexOf(el)
  const children = [...el.childNodes]
  el.remove()
  parent.childNodes.splice(index, 0, ...children)
}

function pruneEmptyElements(root: HTMLElement) {
  const walk = (el: HTMLElement) => {
    for (const child of [...el.childNodes]) {
      if (child.nodeType === 1) pruneEmptyElements(child as HTMLElement)
    }
    const tag = el.tagName?.toLowerCase()
    if (!tag || VOID_TAGS.has(tag)) return
    // หลัง collapseLgMediaBlocks วิดีโอเหลือแค่ src ไม่มีลูก — ห้ามลบ
    if (tag === 'video' && el.getAttribute('src')?.trim()) return
    if (tag === 'iframe' && el.getAttribute('src')?.trim()) return
    const text = el.textContent?.replace(/\s+/g, '').trim()
    const hasElementChild = el.childNodes.some(n => n.nodeType === 1)
    if (!text && !hasElementChild) el.remove()
  }
  walk(root)
}

function sanitizeElement(el: HTMLElement, allowedTags: Set<string>) {
  if (el.getAttribute('data-sanitize-root') === '1') {
    for (const child of [...el.childNodes]) {
      if (child.nodeType === 1) sanitizeElement(child as HTMLElement, allowedTags)
    }
    return
  }

  for (const child of [...el.childNodes]) {
    if (child.nodeType === 1) sanitizeElement(child as HTMLElement, allowedTags)
  }

  const tag = el.tagName?.toLowerCase() ?? ''
  if (!tag) return

  if (DROP_TAGS.has(tag)) {
    el.remove()
    return
  }

  if (!allowedTags.has(tag)) {
    unwrapElement(el)
    return
  }

  applyCleanAttributes(el)
}

function sanitizeWithMode(html: string, mode: 'standard' | 'light') {
  const allowed = mode === 'light' ? TAGS_LIGHT : TAGS_STANDARD
  const root = parse(`<div data-sanitize-root="1">${html}</div>`, { comment: false })
  const wrapper = root.querySelector('div[data-sanitize-root]') as HTMLElement | null
  if (!wrapper) return null

  sanitizeElement(wrapper, allowed)
  collapseLgMediaBlocks(wrapper)
  promoteLazyImageSources(wrapper)
  pruneEmptyElements(wrapper)

  const output = wrapper.innerHTML.trim()
  return output || null
}

function sanitizeKeyFeaturesMinimal(html: string) {
  const parsed = parse(html, { comment: false })
  const texts = parsed
    .querySelectorAll('li')
    .map(li => li.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .filter(Boolean)

  if (!texts.length) {
    return sanitizeWithMode(html, 'standard')
  }

  const items = texts.map(t => `  <li>${escapeHtmlText(t)}</li>`).join('\n')
  return `<ul class="product-key-features">\n${items}\n</ul>`
}

/**
 * ทำความสะอาด HTML จาก LG ก่อนบันทึก DB
 * - minimal: key_features → ul/li + class ของเราเท่านั้น
 * - standard: description, faq
 * - light: features, specifications (เก็บโครงสร้างมากกว่า แต่ตัด class/id/data-*)
 */
export function sanitizeLgHtml(html: string | null | undefined, mode: SanitizeLgHtmlMode) {
  if (!html?.trim()) return null

  try {
    if (mode === 'minimal') {
      return sanitizeKeyFeaturesMinimal(html)
    }
    return sanitizeWithMode(html, mode)
  }
  catch {
    return html.trim() || null
  }
}

export function sanitizeImportedDetailFields<T extends Record<string, string | null | undefined>>(fields: T) {
  return {
    ...fields,
    description: sanitizeLgHtml(fields.description, 'standard'),
    key_features: sanitizeLgHtml(fields.key_features, 'minimal'),
    features: sanitizeLgHtml(fields.features, 'light'),
    specifications: sanitizeLgHtml(fields.specifications, 'light'),
    faq_html: sanitizeLgHtml(fields.faq_html, 'standard'),
  }
}
