/** โค้ดรันใน browser ผ่าน Playwright evaluate — ไฟล์ .mjs ธรรมดา (หลีกเลี่ยง __name จาก bundler) */

export function hasVisibleCardPrices() {
  const prices = Array.from(document.querySelectorAll('.neo-price--price .cell-price'))
  return prices.some(node => /\d/.test((node.textContent || '').trim()))
}

export function toLgSubscribeUrl(href) {
  const trimmed = (href || '').trim()
  if (!trimmed || !trimmed.includes('/th/')) return ''
  let base = trimmed.replace(/\/$/, '')
  if (/\/lgsubscribe-buy$/i.test(base)) {
    return base.replace(/\/lgsubscribe-buy$/i, '/lgsubscribe')
  }
  if (/\/lgsubscribe$/i.test(base)) return base
  if (/\/subscription\//i.test(base)) return ''
  return `${base}/lgsubscribe`
}

function readHrefFromSwatchButton(b) {
  const attrs = ['data-url', 'data-href', 'data-link', 'data-link-url', 'data-detail-url']
  for (const name of attrs) {
    const v = (b.getAttribute(name) || '').trim()
    if (v) {
      const sub = toLgSubscribeUrl(v)
      if (sub) return sub
    }
  }
  const parentHref = b.closest('a')?.getAttribute('href') || ''
  const sub = toLgSubscribeUrl(parentHref)
  if (sub) return sub
  return ''
}

/** การ์ดหมวดธรรมดาที่รองรับ Subscribe — มี badge Subscription */
export function hasSubscriptionBadge(el) {
  // LG PLP จริง: .neo-tag--box > span.tag-gr "Subscription" (ไม่ใช่ class badge)
  for (const tag of el.querySelectorAll('.neo-tag--box span.tag-gr, .neo-tag--box .tag-gr')) {
    const text = (tag.textContent || '').replace(/\s+/g, ' ').trim()
    if (/^subscription$/i.test(text)) return true
  }

  // สำรอง: data-pim-flag บนปุ่มการ์ด เช่น "OMS,gradient,Subscription,..."
  for (const node of el.querySelectorAll('[data-pim-flag]')) {
    const flags = (node.getAttribute('data-pim-flag') || '').split(',')
    if (flags.some(f => f.trim().toLowerCase() === 'subscription')) return true
  }

  return false
}

function readProductDetailHref(el) {
  const selectors = [
    '.neo-card--ufn a[href*="/th/"]',
    '.neo-card--img a[href*="/th/"]',
    'a.cmp-image__link[href*="/th/"]',
    'h3 a[href*="/th/"]',
  ]
  for (const sel of selectors) {
    const href = (el.querySelector(sel)?.getAttribute('href') || '').trim()
    const sub = toLgSubscribeUrl(href)
    if (sub) return sub
  }
  return ''
}

function swatchScope(el) {
  return el.querySelector('.neo-card--sibling') || el
}

export function readSwatchMetaFromCard(el) {
  const buttons = swatchScope(el).querySelectorAll('button.swatch[data-model-id]')
  return Array.from(buttons).map((b) => {
    const modelId = (b.getAttribute('data-model-id') || '').trim()
    const label = (
      b.getAttribute('aria-label')
      || b.querySelector('span')?.textContent
      || ''
    ).trim()
    return { modelId, label, detailUrl: readHrefFromSwatchButton(b) }
  }).filter(s => s.modelId)
}

function cardTitle(el) {
  const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim()
  return text(el.querySelector('h1,h2,h3,h4,.cmp-product-item__title,.c-product-item__name')) || null
}

function readNeoCardDataModelId(el) {
  const attrs = ['data-model-id', 'data-sku', 'data-model-name']
  for (const name of attrs) {
    const onCard = (el.getAttribute(name) || '').trim()
    if (onCard) return onCard
    const nested = el.querySelector(`[${name}]`)
    const v = (nested?.getAttribute(name) || '').trim()
    if (v) return v
  }
  const skuBox = el.querySelector('.neo-card--sku')
  if (skuBox) {
    for (const name of attrs) {
      const v = (skuBox.getAttribute(name) || '').trim()
      if (v) return v
    }
  }
  return null
}

function readNeoCardCopySku(el) {
  const btn = el.querySelector('.neo-card--sku .btn-copy')
  if (!btn) return null
  for (const name of ['data-clipboard-text', 'data-copy-text', 'data-model-id', 'data-sku']) {
    const v = (btn.getAttribute(name) || '').trim()
    if (v && !/copy/i.test(v)) return v.toUpperCase()
  }
  return null
}

/** SKU จากชื่อ / data attribute บนการ์ด */
export function readNeoCardModelSku(el) {
  const fromData = readNeoCardDataModelId(el)
  if (fromData) {
    const short = (fromData.split('.')[0] || '').trim().toUpperCase()
    if (short && !/copy/i.test(short)) return short
  }
  const fromCopy = readNeoCardCopySku(el)
  if (fromCopy) return fromCopy

  const title = cardTitle(el) || ''
  const fromLabel = title.match(/รุ่น\s+([A-Z0-9-]{4,24})/i)?.[1]
  if (fromLabel && !/copy/i.test(fromLabel)) return fromLabel.toUpperCase()
  const embedded = title.match(/\b([A-Z]{2,}\d{2}[A-Z0-9]{4,})\b/)
  if (embedded?.[1] && !/copy/i.test(embedded[1])) return embedded[1].toUpperCase()
  return null
}

/** data-model-id ของ swatch ที่กำลังถูกเลือกอยู่ (เพื่อข้าม wait ที่ไม่จำเป็น) */
export function readActiveSwatchModelId(el) {
  const scope = swatchScope(el)
  const active = scope.querySelector(
    'button.swatch[data-model-id].active, button.swatch[data-model-id].selected, button.swatch[data-model-id][aria-current="true"], button.swatch[data-model-id][aria-pressed="true"], button.swatch[data-model-id].is-active, button.swatch[data-model-id].on',
  )
  return (active?.getAttribute('data-model-id') || '').trim() || null
}

/** เปรียบเทียบ data-model-id (รองรับรูปแบบสั้น/ยาว) */
export function clickSwatchOnCard(el, modelId) {
  const scope = swatchScope(el)
  const buttons = scope.querySelectorAll('button.swatch[data-model-id]')
  for (const b of buttons) {
    if (!modelIdsMatch(b.getAttribute('data-model-id'), modelId)) continue
    b.scrollIntoView({ block: 'center', inline: 'center' })
    b.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    if (typeof b.click === 'function') b.click()
    return true
  }
  return false
}

export function subscribeHrefMatchesModel(el, modelId) {
  const href = readNeoCardSubscribeButtonUrl(el)?.detailUrl || ''
  const sku = (modelId || '').split('.')[0].toLowerCase()
  return Boolean(sku && href.toLowerCase().includes(sku))
}

export function modelIdsMatch(a, b) {
  const left = (a || '').trim().toUpperCase()
  const right = (b || '').trim().toUpperCase()
  if (!left || !right) return false
  if (left === right) return true
  const short = (id) => (id.split('.')[0] || '').trim()
  const ls = short(left)
  const rs = short(right)
  return Boolean(ls && rs && (ls === rs || left.startsWith(rs) || right.startsWith(ls)))
}

/** ปุ่ม subscribe บนการ์ด — อัปเดตหลังคลิก swatch */
function readCopySkuText(el) {
  const raw = (el.querySelector('.neo-card--sku .btn-copy')?.textContent || '').replace(/\s+/g, ' ').trim()
  if (!raw || /copy/i.test(raw)) return null
  return raw
}

export function readNeoCardSubscribeButtonUrl(el) {
  const a = el.querySelector('.neo-card--ufn a[href*="/lgsubscribe"]')
  const href = (a?.getAttribute('href') || '').trim()
  if (!href) return null
  const detailUrl = toLgSubscribeUrl(href)
  if (!detailUrl) return null
  return {
    detailUrl,
    name: cardTitle(el),
    sku: readNeoCardCopySku(el) || readNeoCardModelSku(el),
  }
}

/** ชื่อ + ลิงก์ + SKU บนการ์ด */
export function readNeoCardShared(el) {
  const fromButton = readNeoCardSubscribeButtonUrl(el)
  if (fromButton?.detailUrl) return fromButton

  const imgLink = el.querySelector('.neo-card--img a[href*="/lgsubscribe"]')
  const imgHref = (imgLink?.getAttribute('href') || '').trim()
  const imgSubscribeUrl = imgHref ? toLgSubscribeUrl(imgHref) : ''
  if (imgSubscribeUrl) {
    return {
      detailUrl: imgSubscribeUrl,
      name: cardTitle(el),
      sku: readNeoCardCopySku(el) || readNeoCardModelSku(el),
    }
  }

  const productSub = readProductDetailHref(el)
  if (productSub) {
    return {
      detailUrl: productSub,
      name: cardTitle(el),
      sku: readNeoCardCopySku(el) || readCopySkuText(el),
    }
  }

  return null
}

/** ราคารายเดือน + ราคาเต็มบนการ์ด (หลังคลิก swatch) */
export function readNeoCardPrices(el) {
  const parsePrice = (value) => {
    const cleaned = value.replace(/[^\d.]/g, '')
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim()
  return {
    discountedPrice: parsePrice(text(el.querySelector('.neo-price--price .cell-price'))),
    fullPrice: parsePrice(text(el.querySelector('.neo-price--price .cell-after del'))),
  }
}
