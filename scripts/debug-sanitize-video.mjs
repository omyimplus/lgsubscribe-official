import { parse } from 'node-html-parser'
import { sanitizeLgHtml } from '../server/utils/sanitizeLgHtml.ts'
import { collapseLgMediaBlocks, promoteLazyImageSources } from '../server/utils/lgMediaBlocks.ts'

function extractOverviewInner(html) {
  const m = html.match(/id=["']pdp-overview-section["']/i)
  if (!m) throw new Error('no pdp-overview-section')
  const openStart = html.lastIndexOf('<', m.index)
  const tag = html.slice(openStart).match(/^<([a-z]+)/i)[1].toLowerCase()
  const cs = html.indexOf('>', m.index) + 1
  let pos = cs
  let depth = 1
  const oR = new RegExp(`<${tag}\\b`, 'gi')
  const cR = new RegExp(`</${tag}\\s*>`, 'gi')
  while (pos < html.length && depth > 0) {
    oR.lastIndex = pos
    cR.lastIndex = pos
    const om = oR.exec(html)
    const cm = cR.exec(html)
    if (!cm) break
    const oi = om ? om.index : Number.POSITIVE_INFINITY
    const ci = cm.index
    if (oi < ci) {
      depth += 1
      pos = oi + om[0].length
    }
    else {
      depth -= 1
      if (depth === 0) return html.slice(cs + 1, ci)
      pos = ci + cm[0].length
    }
  }
  throw new Error('no closing tag')
}

const url = 'https://www.lg.com/th/tv-soundbars/oled-evo/oled77c6psa/lgsubscribe'
const res = await fetch(url, {
  redirect: 'follow',
  headers: {
    'user-agent': 'Mozilla/5.0',
    referer: 'https://www.lg.com/th/subscription/tvs/',
  },
})
const html = await res.text()
const inner = extractOverviewInner(html)

console.log('RAW videos:', (inner.match(/<video/gi) || []).length)
console.log('RAW sources:', (inner.match(/<source/gi) || []).length)

const sanitized = sanitizeLgHtml(inner, 'light')
console.log('sanitized videos:', (sanitized?.match(/<video/gi) || []).length)
console.log('sanitized sources:', (sanitized?.match(/<source/gi) || []).length)
console.log('sanitized mp4:', (sanitized?.match(/\.mp4/gi) || []).length)

const root = parse(`<div data-root="1">${inner}</div>`)
const w = root.querySelector('div[data-root]')
collapseLgMediaBlocks(w)
const collapsedOnly = w.innerHTML
console.log('collapse-only videos:', (collapsedOnly.match(/<video/gi) || []).length)
console.log('collapse-only mp4:', (collapsedOnly.match(/\.mp4/gi) || []).length)

if (sanitized) {
  const vi = sanitized.search(/<video/i)
  if (vi >= 0) console.log('sanitized sample:', sanitized.slice(vi, vi + 300).replace(/\s+/g, ' '))
}

// Step-by-step: sanitizeElement then collapse (mirror sanitizeWithMode)
const TAGS_LIGHT = new Set([
  'a', 'b', 'blockquote', 'br', 'div', 'em', 'figcaption', 'figure',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'i', 'img', 'li', 'ol', 'p', 'picture',
  'source', 'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr',
  'u', 'ul', 'video', 'article', 'button', 'caption', 'dl', 'dt', 'dd', 'footer', 'header',
  'iframe', 'main', 'nav', 'section', 'sub', 'sup', 'time',
])
const DROP = new Set(['script', 'style', 'noscript', 'link', 'meta', 'base', 'template'])
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
const LG = 'https://www.lg.com'

function keepAttr(tag, name, value) {
  const attr = name.toLowerCase()
  if (attr.startsWith('on') || attr === 'style' || attr === 'id') return null
  if (attr.startsWith('data-') || attr.startsWith('aria-') || attr === 'role') return null
  if (attr === 'class') return null
  if (attr === 'href' || attr === 'src' || attr === 'poster') {
    const v = value.trim()
    const url = v.startsWith('/') ? LG + v : v
    return { name: attr, value: url }
  }
  const allowed = ['alt', 'title', 'colspan', 'rowspan', 'width', 'height', 'controls', 'type', 'playsinline', 'loop', 'muted', 'preload', 'target', 'rel']
  if (!allowed.includes(attr)) return null
  return { name: attr, value }
}

function unwrap(el) {
  const p = el.parentNode
  if (!p) return
  const i = p.childNodes.indexOf(el)
  const ch = [...el.childNodes]
  el.remove()
  p.childNodes.splice(i, 0, ...ch)
}

function sanitizeEl(el) {
  if (el.getAttribute('data-sanitize-root') === '1') {
    for (const c of [...el.childNodes]) if (c.nodeType === 1) sanitizeEl(c)
    return
  }
  for (const c of [...el.childNodes]) if (c.nodeType === 1) sanitizeEl(c)
  const tag = el.tagName?.toLowerCase() ?? ''
  if (DROP.has(tag)) { el.remove(); return }
  if (!TAGS_LIGHT.has(tag)) { unwrap(el); return }
  const attrs = { ...el.attributes }
  for (const n of Object.keys(attrs)) el.removeAttribute(n)
  for (const [n, v] of Object.entries(attrs)) {
    const k = keepAttr(tag, n, v)
    if (k) el.setAttribute(k.name, k.value)
  }
}

function prune(el) {
  for (const c of [...el.childNodes]) if (c.nodeType === 1) prune(c)
  const tag = el.tagName?.toLowerCase()
  if (!tag || VOID.has(tag)) return
  const text = el.textContent?.replace(/\s+/g, '').trim()
  const hasEl = el.childNodes.some(n => n.nodeType === 1)
  if (!text && !hasEl) el.remove()
}

const root2 = parse(`<div data-sanitize-root="1">${inner}</div>`)
const w2 = root2.querySelector('div[data-sanitize-root]')
sanitizeEl(w2)
console.log('after sanitizeEl videos:', w2.querySelectorAll('video').length, 'sources:', w2.querySelectorAll('source').length)
const v0 = w2.querySelector('video')
if (v0) console.log('  first video child tags:', [...v0.childNodes].map(n => n.nodeType === 1 ? n.tagName : `#${n.nodeType}`))

collapseLgMediaBlocks(w2)
console.log('after sanitizeEl+collapse videos:', w2.querySelectorAll('video').length, 'mp4:', (w2.innerHTML.match(/\.mp4/gi) || []).length)

promoteLazyImageSources(w2)
prune(w2)
console.log('after full pipeline clone videos:', w2.querySelectorAll('video').length)
