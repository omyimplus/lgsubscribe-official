import type { Page } from 'playwright'
import { sanitizeImportedDetailFields } from './sanitizeLgHtml'
import {
  scrapeTvPlpVariants,
  variantGroupKeyFromDetailUrl,
  type DomCardRaw,
} from './lgListCardDomScrape'
import {
  enrichDomRowsFromApi,
  fetchRetrieveProductListInPage,
  fullSkusForRetrieveRequest,
} from './lgRetrieveProductList'
import { hasVisibleCardPricesFn } from './lgListCardDomScrape'
import { extractPdpImageUrls } from './lgPdpImages'
import { createImportLogger, type ImportLogger } from './lgImportLog'
import {
  buildVariantCardName,
  LG_SUBSCRIPTION_PAGE_SIZE,
  LG_TV_LIST_URL,
  resolveLgProductSku,
  subscriptionListPageUrl,
} from './lgSubscriptionSources'
import { getLgScrapeProfile, launchLgBrowser } from './lgBrowserLaunch'

const TVS_LIST_URL = LG_TV_LIST_URL
const PRICE_RENDER_MAX_RETRIES = 3
const PRICE_RENDER_WAIT_TIMEOUT_MS = 60000
/** สูงสุด ~25 หน้า × 9 การ์ด/หน้า (LG ใช้ firstResult) */
const MAX_PLP_PAGES = 25

const PLP_CARD_SELECTOR = 'li.c-product-list__item.neo-card'

/** ปิด cookie banner — หลังคลิก LG มักรีเรนเดอร์ list เป็น 0 การ์ดชั่วคราว */
async function dismissLgCookieBanner(page: Page, log: ImportLogger) {
  for (const label of ['ยอมรับทั้งหมด', 'Reject All', 'Accept all']) {
    const btn = page.getByRole('button', { name: label }).first()
    if (await btn.isVisible().catch(() => false)) {
      log.info(`cookie banner — clicking "${label}"`)
      await btn.click().catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      await page.waitForTimeout(800)
      return true
    }
  }
  return false
}

/** รอการ์ด PLP โหลด — ถ้าเพิ่งปิด cookie ต้องรอรอบที่สอง */
async function waitForPlpProductCards(
  page: Page,
  log: ImportLogger,
  label: string,
  options?: { tryDismissCookie?: boolean, fastEmpty?: boolean },
) {
  const poll = async (timeoutMs: number) => {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const count = await page.locator(PLP_CARD_SELECTOR).count()
      if (count > 0) return count
      await page.waitForTimeout(1000)
    }
    return page.locator(PLP_CARD_SELECTOR).count()
  }

  const firstWaitMs = options?.fastEmpty ? 12_000 : 45_000
  const afterCookieWaitMs = options?.fastEmpty ? 18_000 : 60_000

  let count = await poll(firstWaitMs)
  if (options?.tryDismissCookie) {
    const clicked = await dismissLgCookieBanner(page, log)
    if (clicked) {
      log.info(`${label} — re-wait product cards after cookie`)
      count = await poll(afterCookieWaitMs)
    }
  }
  return count
}

type PlpNavigateResult = {
  status: 'ok' | 'empty' | 'denied'
  cardCount: number
}

function isValidTvDetailUrl(url: string) {
  // PDP subscription เช่น /th/tv-soundbars/oled-evo/oled77c6psa/lgsubscribe (ความลึก path อาจ > 3)
  if (!url.includes('/lgsubscribe')) return false
  if (url.includes('/subscription/tvs/lgsubscribe')) return false
  const m = url.match(/^https:\/\/www\.lg\.com\/th\/(.+?)\/lgsubscribe\/?$/i)
  if (!m?.[1]) return false
  const segments = m[1].split('/').filter(Boolean)
  // อย่างน้อย category + model slug เช่น tv-soundbars/65qned80bsa
  return segments.length >= 2
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&#x27;/g, '\'')
}

function stripTags(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ').trim()
}

function normalizeUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url.replace(/\/$/, '')
  return `https://www.lg.com${url.startsWith('/') ? '' : '/'}${url}`.replace(/\/$/, '')
}

function parseNumberLoose(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const normalized = value.replace(/[^\d.]/g, '')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizePrice(value: number | null) {
  if (value === null) return null
  return value > 0 ? value : null
}

function extractWarrantyYears(text: string | null | undefined) {
  if (!text) return null
  const m = text.match(/(\d+)\s*(?:ปี|year)/i)
  return m ? Number(m[1]) : null
}

function normalizeSpaceText(value: string | null | undefined) {
  if (!value) return ''
  return stripTags(String(value)).replace(/\s+/g, ' ').trim()
}

function pickByRegex(values: string[], regexes: RegExp[]) {
  for (const value of values) {
    for (const regex of regexes) {
      if (regex.test(value)) return value
    }
  }
  return null
}

function collectStringValues(node: Record<string, unknown>) {
  return Object.values(node)
    .filter(v => typeof v === 'string')
    .map(v => normalizeSpaceText(String(v)))
    .filter(Boolean)
}

function collectUrlLikeValues(node: Record<string, unknown>) {
  return collectStringValues(node)
    .filter(v => /^https?:\/\//i.test(v) || v.startsWith('/'))
    .map(normalizeUrl)
}

export function normalizeModelKeyFromUrl(url: string) {
  const normalized = normalizeUrl(url)
  const matched = normalized.match(/\/([^/]+)\/lgsubscribe\/?$/i)
  return matched?.[1]?.toUpperCase() ?? null
}

export type TvListCard = {
  source_url: string
  model_key: string | null
  name: string | null
  headline: string | null
  base_price: number | null
  full_price: number | null
  warranty_years: number | null
  subscription_note: string | null
  purchase_only_label: string | null
  purchase_only_url: string | null
  lg_model_id?: string | null
  variant_label?: string | null
  variant_group_key?: string | null
  /** PDP ร่วมของทุกขนาดจอในการ์ดเดียวกัน */
  shared_detail_url?: string | null
  /** ตำแหน่งการ์ดบน PLP (audit 1 card = 1 group) */
  plp_card_key?: string | null
}

function pickTextByHints(values: string[], hints: string[]) {
  if (!values.length) return null
  const found = values.find(v => hints.some(h => v.toLowerCase().includes(h)))
  return found ?? values[0] ?? null
}

function toLgSubscribeUrl(rawUrl: string | null | undefined) {
  const normalized = normalizeUrl(String(rawUrl || '').trim())
  if (!normalized) return ''
  if (normalized.includes('/lgsubscribe')) return normalized
  const withSubscribe = `${normalized.replace(/\/$/, '')}/lgsubscribe`
  return isValidTvDetailUrl(withSubscribe) ? withSubscribe : ''
}

function mapRawCard(raw: any): TvListCard | null {
  const detailHref = String(raw?.detailUrl || raw?.url || raw?.href || '').trim()
  const modelCandidate = resolveLgProductSku(
    raw?.lgModelId ? String(raw.lgModelId) : null,
    raw?.sku ?? raw?.modelName,
  ) || null
  const sourceUrl = toLgSubscribeUrl(detailHref)
  if (!sourceUrl || !isValidTvDetailUrl(sourceUrl)) return null
  const sharedDetailHref = String(raw?.sharedDetailUrl || '').trim()
  const sharedDetailUrl = sharedDetailHref ? toLgSubscribeUrl(sharedDetailHref) : null
  const groupKey = String(raw?.variantGroupKey || '').trim()
    || variantGroupKeyFromDetailUrl(sourceUrl, 'model')
    || String(raw?.plpCardKey || '').trim()
    || null

  const normalizedRaw = asRecord(raw)
  const looseTextPool = collectStringValues(normalizedRaw)
  const stringPool = [
    raw?.subscriptionNote,
    raw?.subscription_note,
    raw?.promoNote,
    raw?.promo,
    raw?.warrantyText,
    raw?.warranty,
    raw?.headline,
    raw?.purchaseOnlyLabel,
    raw?.purchaseLabel,
    ...looseTextPool,
  ]
    .filter(Boolean)
    .map((v: any) => String(v).trim())
    .filter(Boolean)

  const explicitWarranty = parseNumberLoose(raw?.warrantyYears ?? raw?.warranty_years)
  const warrantyYears = explicitWarranty ?? extractWarrantyYears(stringPool.join(' '))

  const inferredHeadline = pickByRegex(stringPool, [
    /ยิ่งซับมาก\s*ยิ่งลดมาก!?/i,
    /(?:โปร|promotion|promo).*(?:subscribe|subscription|สมาชิก|เดือน)/i,
    /(?:ส่วนลด|ลด).*?(?:เดือน|month|subscribe|subscription)/i,
  ])
  const inferredSubNote = pickByRegex(stringPool, [
    /(?:ส่วนลด|สิทธิพิเศษ|เฉพาะ).*?(?:12|เดือน|month|subscribe|subscription)/i,
    /12\s*(?:เดือน|month)/i,
    /(?:subscribe|subscription).*?(?:only|เฉพาะ)/i,
  ])
  const inferredPurchaseLabel = pickByRegex(stringPool, [
    /ซื้อขาด/i,
    /ซื้อ(?:เลย|ทันที)/i,
    /(?:buy\s*now|purchase\s*only|shop\s*now)/i,
  ])
  const inferredPurchaseUrl = collectUrlLikeValues(normalizedRaw).find(url => !url.includes('/lgsubscribe')) || null

  return {
    source_url: sourceUrl,
    model_key: modelCandidate || normalizeModelKeyFromUrl(sourceUrl),
    name: buildVariantCardName(
      raw?.name ? String(raw.name).trim() : null,
      raw?.variantLabel ? String(raw.variantLabel).trim() : null,
      modelCandidate || '',
    ) || null,
    headline: raw?.headline ? String(raw.headline).trim() : inferredHeadline,
    base_price: parseNumberLoose(raw?.discountedPrice ?? raw?.monthlyPrice ?? raw?.basePrice ?? raw?.base_price),
    full_price: parseNumberLoose(raw?.fullPrice ?? raw?.originalPrice ?? raw?.full_price),
    warranty_years: warrantyYears,
    subscription_note: raw?.subscriptionNote
      ? String(raw.subscriptionNote).trim()
      : raw?.subscription_note
        ? String(raw.subscription_note).trim()
        : inferredSubNote || pickTextByHints(stringPool, ['12', 'เดือน', 'month', 'เฉพาะ']),
    purchase_only_label: raw?.purchaseOnlyLabel
      ? String(raw.purchaseOnlyLabel).trim()
      : raw?.purchaseLabel
        ? String(raw.purchaseLabel).trim()
        : inferredPurchaseLabel,
    purchase_only_url: raw?.purchaseOnlyUrl
      ? normalizeUrl(String(raw.purchaseOnlyUrl).trim())
      : inferredPurchaseUrl,
    lg_model_id: raw?.lgModelId ? String(raw.lgModelId).trim() : null,
    variant_label: raw?.variantLabel ? String(raw.variantLabel).trim() : null,
    variant_group_key: groupKey,
    shared_detail_url: sharedDetailUrl && isValidTvDetailUrl(sharedDetailUrl) ? sharedDetailUrl : null,
    plp_card_key: raw?.plpCardKey ? String(raw.plpCardKey).trim() : null,
  }
}

const BROWSER_LIKE_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'

function pdpFetchHeaders(detailUrl: string) {
  const pathMatch = detailUrl.match(/\/th\/([^/]+)/i)
  const segment = pathMatch?.[1] ?? 'subscription'
  return {
    'user-agent': BROWSER_LIKE_UA,
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
    'referer': `https://www.lg.com/th/subscription/${segment}/`,
  }
}

/** ดึง HTML หน้า PDP — ใช้ fetch มาตรฐาน (รันได้ทั้งใน Nuxt และสคริปต์ tsx) */
async function fetchPdpHtml(detailUrl: string) {
  const res = await fetch(detailUrl, {
    redirect: 'follow',
    headers: pdpFetchHeaders(detailUrl),
  })
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return res.text()
}

/** ตรวจว่าเปิดหน้า PDP ได้ (ข้าม URL 404 ของบางขนาดจอ) — UA เบราว์เซอร์จริงกัน LG block */
export async function probeTvDetailUrl(detailUrl: string) {
  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const res = await fetch(detailUrl, {
        method,
        redirect: 'follow',
        headers: pdpFetchHeaders(detailUrl),
      })
      if (res.ok) return true
      // 404/410 = ไม่มีจริง; 403/405/timeout = อาจโดน block → ลอง GET ต่อ
      if (res.status === 404 || res.status === 410) return false
    }
    catch {
      // network/timeout → ลอง method ถัดไป
    }
  }
  return false
}

export async function resolveGroupDetailUrl(
  cards: TvListCard[],
  log?: ImportLogger,
) {
  const candidates = [...new Set(
    [
      ...cards.map(c => c.shared_detail_url),
      ...cards.map(c => c.source_url),
    ]
      .filter((url): url is string => Boolean(url && isValidTvDetailUrl(url))),
  )]

  for (const url of candidates) {
    if (await probeTvDetailUrl(url)) {
      log?.info(`group ${cards[0]?.variant_group_key ?? '?'} detail URL ok: ${url}`)
      return url
    }
    log?.warn(`group ${cards[0]?.variant_group_key ?? '?'} detail URL not available (404?): ${url}`)
  }

  const skus = cards.map(c => c.model_key).filter(Boolean).join(', ')
  throw new Error(`ไม่พบหน้ารายละเอียดที่เปิดได้สำหรับกลุ่มสินค้า (${skus})`)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

export type LgPlpScrapeOptions = {
  /** path สำหรับ retrieveProductList (default ตาม lgSlug หรือ tvs) */
  listPath?: string
  lgSlug?: string
  /** หมวดไม่มีสินค้า → คืน [] ไม่ throw (default true) */
  allowEmpty?: boolean
}

/** PLP: DOM เป็นหลัก (การ์ด + swatch) แล้ว enrich ชื่อจาก retrieveProductList — ไม่ merge Coveo */
export async function collectTvListCardsWithBrowser(
  limit = 3,
  listUrl: string = TVS_LIST_URL,
  scrapeOptions?: LgPlpScrapeOptions,
): Promise<TvListCard[]> {
  const log = createImportLogger('plp-browser')
  const totalStart = Date.now()
  log.step(`launch browser limit=${limit}`)

  const scrapeProfile = getLgScrapeProfile()
  const browser = await launchLgBrowser(log)
  log.done('launch browser')

  const context = await browser.newContext({
    userAgent: scrapeProfile.userAgent,
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    viewport: { width: 1366, height: 900 },
    extraHTTPHeaders: {
      'accept-language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  })
  await context.addInitScript((platform: string) => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    Object.defineProperty(navigator, 'languages', { get: () => ['th-TH', 'th', 'en-US', 'en'] })
    Object.defineProperty(navigator, 'platform', { get: () => platform })
    ;(window as unknown as { chrome?: { runtime: Record<string, unknown> } }).chrome = { runtime: {} }
  }, scrapeProfile.navigatorPlatform)
  const page = await context.newPage()
  let cookieBannerHandled = false

  /** ตรวจหน้า Access Denied (Akamai) — title/เนื้อหา */
  const detectAccessDenied = async () => {
    try {
      const title = (await page.title().catch(() => '')) || ''
      if (/access denied|denied|forbidden|pardon our interruption/i.test(title)) return true
      const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 600) || '').catch(() => '')
      return /access denied|you don't have permission|reference #\d|pardon our interruption|unusual traffic/i.test(bodyText)
    }
    catch {
      return false
    }
  }

  const allowEmpty = scrapeOptions?.allowEmpty !== false

  /** เปิด URL — มีการ์ด / หมวดว่าง / โดน block */
  const gotoWithAntiBlock = async (url: string, label: string): Promise<PlpNavigateResult> => {
    const tryDismissCookie = !cookieBannerHandled
    const maxTries = allowEmpty ? 2 : 4
    for (let attempt = 1; attempt <= maxTries; attempt += 1) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
      await page.waitForTimeout(2000)
      const denied = await detectAccessDenied()
      if (denied) {
        log.warn(`${label} Access Denied (try ${attempt}/${maxTries})`)
      }
      else {
        const cardCount = await waitForPlpProductCards(page, log, label, {
          tryDismissCookie: tryDismissCookie && attempt === 1,
          fastEmpty: allowEmpty,
        })
        if (tryDismissCookie && attempt === 1) cookieBannerHandled = true
        if (cardCount > 0) {
          if (attempt > 1) log.info(`${label} ok after ${attempt} tries (${cardCount} cards)`)
          return { status: 'ok', cardCount }
        }
        if (allowEmpty) {
          log.info(`${label} — no product cards on PLP (empty category)`)
          return { status: 'empty', cardCount: 0 }
        }
        log.warn(`${label} no product cards (try ${attempt}/${maxTries}, count=${cardCount})`)
      }
      if (attempt < maxTries) {
        const backoff = 3000 * attempt + Math.floor(Math.random() * 2000)
        await page.waitForTimeout(backoff)
      }
    }
    const denied = await detectAccessDenied()
    const cardCount = await page.locator(PLP_CARD_SELECTOR).count()
    if (denied) return { status: 'denied', cardCount }
    if (cardCount === 0 && allowEmpty) return { status: 'empty', cardCount: 0 }
    return { status: 'denied', cardCount }
  }

  try {
    log.step(`navigate PLP ${listUrl}`)
    const nav = await gotoWithAntiBlock(listUrl, 'navigate PLP')
    await page.waitForTimeout(1200 + Math.floor(Math.random() * 800))
    if (nav.status === 'denied') {
      throw new Error('LG ปฏิเสธการเข้าถึง (Access Denied) — ลองใหม่อีกครั้งในอีกสักครู่')
    }
    if (nav.status === 'empty') {
      log.done('navigate PLP (empty — no products in this category)')
      return []
    }
    log.done('navigate PLP')

    const domCardsRaw: DomCardRaw[] = []
    const seenSkus = new Set<string>()

    const scrapePageWithPriceWait = async (pageIndex: number, maxUniqueSkus?: number) => {
      for (let attempt = 1; attempt <= PRICE_RENDER_MAX_RETRIES; attempt += 1) {
        log.info(`page ${pageIndex + 1} price attempt ${attempt}/${PRICE_RENDER_MAX_RETRIES}`)
        await page.waitForFunction(hasVisibleCardPricesFn(), { timeout: PRICE_RENDER_WAIT_TIMEOUT_MS }).catch(() => false)
        const rows = await scrapeTvPlpVariants(page, { maxUniqueSkus, pageIndex })
        if (rows.some(row => row.discountedPrice !== null || row.fullPrice !== null)) {
          return rows
        }
        if (attempt < PRICE_RENDER_MAX_RETRIES) {
          log.warn(`page ${pageIndex + 1} no prices — reload`)
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
          await page.waitForTimeout(2500)
        }
      }
      return await scrapeTvPlpVariants(page, { maxUniqueSkus, pageIndex })
    }

    for (let pageIndex = 0; pageIndex < MAX_PLP_PAGES; pageIndex += 1) {
      const pageUrl = subscriptionListPageUrl(listUrl, pageIndex)
      if (pageIndex > 0) {
        log.step(`PLP page ${pageIndex + 1} ${pageUrl}`)
        // เว้นช่วงแบบสุ่มก่อนเปลี่ยนหน้า ลดโอกาสโดน anti-bot
        await page.waitForTimeout(1200 + Math.floor(Math.random() * 1500))
        const pageNav = await gotoWithAntiBlock(pageUrl, `PLP page ${pageIndex + 1}`)
        await page.waitForTimeout(1000 + Math.floor(Math.random() * 800))
        if (pageNav.status !== 'ok') {
          log.warn(`PLP page ${pageIndex + 1} stop (${pageNav.status}) — ใช้ข้อมูลที่ได้แล้ว ${domCardsRaw.length} rows`)
          break
        }
      }

      const cardsOnPage = await page.locator(PLP_CARD_SELECTOR).count()
      log.info(`PLP page ${pageIndex + 1}: ${cardsOnPage} product card(s) (page size ${LG_SUBSCRIPTION_PAGE_SIZE})`)
      if (cardsOnPage === 0) {
        log.info(`PLP page ${pageIndex + 1} empty — stop pagination`)
        break
      }

      const remainingSkus = limit > 0 ? Math.max(0, limit - seenSkus.size) : undefined
      const pageRows = pageIndex === 0
        ? await (async () => {
            log.step('scrape PLP page 1')
            const rows = await scrapePageWithPriceWait(0, remainingSkus)
            log.done(`scrape PLP page 1 (${rows.length} variant rows)`)
            return rows
          })()
        : await scrapePageWithPriceWait(pageIndex, remainingSkus)

      if (!pageRows.length) {
        log.info(`PLP page ${pageIndex + 1} no variant rows — stop pagination`)
        break
      }

      let newSkuCount = 0
      for (const row of pageRows) {
        const sku = (row.sku || (row.lgModelId ? resolveLgProductSku(row.lgModelId, null) : '')).toUpperCase()
        if (sku && !seenSkus.has(sku)) {
          seenSkus.add(sku)
          newSkuCount += 1
        }
        domCardsRaw.push(row)
      }
      log.info(`PLP page ${pageIndex + 1}: +${newSkuCount} new SKU(s), ${pageRows.length} rows (total ${domCardsRaw.length})`)

      if (limit > 0 && seenSkus.size >= limit) {
        log.info(`reached limit ${limit} unique SKU(s) — stop PLP pagination`)
        break
      }
      if (pageIndex > 0 && newSkuCount === 0) {
        log.info('no new SKUs on this page — stop pagination')
        break
      }
      if (cardsOnPage < LG_SUBSCRIPTION_PAGE_SIZE) {
        log.info('last PLP page (fewer cards than page size)')
        break
      }
    }

    if (!domCardsRaw.length) {
      if (allowEmpty) {
        log.info('PLP scrape — no rows (empty category)')
        return []
      }
      throw new Error('เปิดหน้าจอไม่ขึ้น: ไม่พบการ์ดสินค้าในหน้า LG (อาจโดน block — ลองใหม่อีกครั้ง)')
    }
    const pricedRows = domCardsRaw.filter(row => row.discountedPrice !== null || row.fullPrice !== null).length
    if (!pricedRows) {
      log.warn(`พบ ${domCardsRaw.length} การ์ด แต่ราคายังไม่ขึ้น — เก็บรายการไว้ก่อน ราคาจะเติมจากหน้า PDP ตอน import`)
    }

    log.info(`PLP pagination done — ${domCardsRaw.length} variant row(s) (${pricedRows} with price), ${seenSkus.size} unique SKU(s)`)

    let rowsForMap = domCardsRaw
    try {
      log.step('enrich names from retrieveProductList')
      const apiSkus = fullSkusForRetrieveRequest(domCardsRaw)
      const listPath = scrapeOptions?.listPath
        ?? (scrapeOptions?.lgSlug ? `/th/subscription/${scrapeOptions.lgSlug}/` : '/th/subscription/tvs/')
      const apiIndex = await fetchRetrieveProductListInPage(page, apiSkus, listPath)
      rowsForMap = enrichDomRowsFromApi(domCardsRaw, apiIndex)
      log.done(`enrich names from retrieveProductList (${apiIndex.size} API SKU(s))`)
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      log.warn(`retrieveProductList enrich skipped: ${message}`)
    }

    const uniqueByKey = new Map<string, TvListCard>()
    let droppedInvalidUrl = 0
    let droppedNoSku = 0
    for (const raw of rowsForMap) {
      const card = mapRawCard(raw)
      if (!card?.source_url || !isValidTvDetailUrl(card.source_url)) {
        droppedInvalidUrl += 1
        log.warn(`drop row — invalid detail URL: ${raw.detailUrl ?? '?'} (sku=${raw.sku ?? raw.lgModelId ?? '?'})`)
        continue
      }
      const sku = (card.model_key || normalizeModelKeyFromUrl(card.source_url) || '').toUpperCase()
      if (!sku) {
        droppedNoSku += 1
        log.warn(`drop row — no SKU: ${card.source_url}`)
        continue
      }
      const prev = uniqueByKey.get(sku)
      if (!prev) {
        uniqueByKey.set(sku, card)
        continue
      }
      uniqueByKey.set(sku, {
        ...prev,
        ...card,
        name: card.name || prev.name,
        base_price: normalizePrice(card.base_price) ?? normalizePrice(prev.base_price),
        full_price: normalizePrice(card.full_price) ?? normalizePrice(prev.full_price),
        variant_label: card.variant_label ?? prev.variant_label,
        lg_model_id: card.lg_model_id ?? prev.lg_model_id,
        variant_group_key: card.variant_group_key ?? prev.variant_group_key,
        shared_detail_url: card.shared_detail_url ?? prev.shared_detail_url,
        plp_card_key: card.plp_card_key ?? prev.plp_card_key,
      })
    }

    const output = [...uniqueByKey.values()].slice(0, limit)
    if (droppedInvalidUrl || droppedNoSku) {
      log.warn(`dropped ${droppedInvalidUrl} invalid-URL + ${droppedNoSku} no-SKU row(s)`)
    }
    if (uniqueByKey.size !== rowsForMap.length) {
      log.info(`deduped ${rowsForMap.length} DOM row(s) → ${uniqueByKey.size} unique SKU(s)`)
    }
    if (uniqueByKey.size > limit) {
      log.warn(`capped at limit ${limit} (found ${uniqueByKey.size} unique SKU)`)
    }
    log.info(
      `PLP scrape done — ${output.length} unique SKU(s) from ${domCardsRaw.length} row(s) in ${Date.now() - totalStart}ms (closing browser in background)`,
    )
    return output
  }
  finally {
    const ctx = context
    const br = browser
    log.step('close browser')
    void (async () => {
      try {
        await ctx.close().catch(() => {})
        await br.close().catch(() => {})
        log.done('close browser')
      }
      catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        log.warn(`close browser failed: ${message}`)
      }
    })()
  }
}


export async function collectTvDetailUrls(limit = 3) {
  const listCards = await collectTvListCardsWithBrowser(limit).catch(() => [])
  const cardUrls = listCards
    .map(card => card.source_url)
    .filter(isValidTvDetailUrl)
  if (cardUrls.length) return cardUrls.slice(0, limit)

  const html = await $fetch<string>(TVS_LIST_URL, { responseType: 'text' }).catch(() => '')
  if (html) {
    const decoded = decodeHtml(html).replace(/\\\//g, '/')

    const direct = [
      ...decoded.matchAll(/https?:\/\/www\.lg\.com\/th\/[a-z0-9\-\/]+\/lgsubscribe\/?/gi),
    ].map(m => normalizeUrl(m[0]))

    const relative = [
      ...decoded.matchAll(/\/th\/[a-z0-9\-\/]+\/lgsubscribe\/?/gi),
    ].map(m => normalizeUrl(m[0]))

    const unique = [...new Set([...direct, ...relative])]
      .filter(isValidTvDetailUrl)
    if (unique.length) return unique.slice(0, limit)
  }

  throw new Error('ไม่พบรายการทีวีจากหน้าแรก กรุณาลองใหม่อีกครั้ง')
}

function escapeRegExp(value: string) {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

function extractSectionHtml(html: string, headingRegex: RegExp) {
  const headingMatch = headingRegex.exec(html)
  if (!headingMatch || headingMatch.index === undefined) return null
  const after = html.slice(headingMatch.index + headingMatch[0].length)
  const endMatch = after.match(/<(h1|h2|h3|h4|h5)[^>]*>/i)
  const chunk = endMatch ? after.slice(0, endMatch.index) : after
  const cleaned = chunk.trim()
  return cleaned ? cleaned : null
}

/** Inner HTML ของ element ที่มี id กำหนด (รองรับ nested tag ชนิดเดียวกัน) */
function extractElementInnerHtmlById(html: string, id: string) {
  const idPattern = new RegExp(`\\bid=["']${escapeRegExp(id)}["']`, 'i')
  const idMatch = idPattern.exec(html)
  if (!idMatch || idMatch.index === undefined) return null

  const openStart = html.lastIndexOf('<', idMatch.index)
  if (openStart < 0) return null

  const openTagMatch = html.slice(openStart).match(/^<([a-z][a-z0-9]*)\b/i)
  if (!openTagMatch) return null

  const tagName = openTagMatch[1].toLowerCase()
  const contentStart = html.indexOf('>', idMatch.index)
  if (contentStart < 0) return null

  let pos = contentStart + 1
  let depth = 1
  const openTagRe = new RegExp(`<${tagName}\\b`, 'gi')
  const closeTagRe = new RegExp(`</${tagName}\\s*>`, 'gi')

  while (pos < html.length && depth > 0) {
    openTagRe.lastIndex = pos
    closeTagRe.lastIndex = pos
    const openM = openTagRe.exec(html)
    const closeM = closeTagRe.exec(html)
    if (!closeM) break

    const openIdx = openM ? openM.index : Number.POSITIVE_INFINITY
    const closeIdx = closeM.index

    if (openIdx < closeIdx) {
      depth += 1
      pos = openIdx + openM![0].length
    }
    else {
      depth -= 1
      if (depth === 0) {
        const inner = html.slice(contentStart + 1, closeIdx).trim()
        return inner || null
      }
      pos = closeIdx + closeM[0].length
    }
  }

  return null
}

/** LG PDP: คุณสมบัติ — เนื้อหาทั้งก้อนใน #pdp-overview-section */
function extractPdpOverviewSectionHtml(html: string) {
  return extractElementInnerHtmlById(html, 'pdp-overview-section')
}

/** LG PDP: สเปค — เนื้อหาทั้งก้อนใน #pdp-specs-section */
function extractPdpSpecsSectionHtml(html: string) {
  return extractElementInnerHtmlById(html, 'pdp-specs-section')
}

/** LG PDP: รายการคุณลักษณะที่สำคัญอยู่ใน ul#keyFeatureList (ครบใน HTML โดยไม่ต้องกด "เพิ่มเติม") */
function extractKeyFeatureListHtml(html: string) {
  const match = html.match(
    /<ul\b[^>]*\bid=["']keyFeatureList["'][^>]*>[\s\S]*?<\/ul>/i,
  )
  if (!match) return null
  const cleaned = match[0].trim()
  return cleaned || null
}

function buildFaqHtmlFromText(html: string) {
  const text = stripTags(html)
  const faqStart = text.indexOf('FAQ')
  if (faqStart < 0) return null
  const faqText = text.slice(faqStart)
  const qaMatches = [...faqText.matchAll(/Q\.\s*(.*?)\s*A\.\s*(.*?)(?=Q\.|$)/g)]
  if (!qaMatches.length) return null

  const blocks = qaMatches.slice(0, 20).map((m) => {
    const q = m[1].trim()
    const a = m[2].trim()
    return `<div class="faq-item"><p><strong>Q.</strong> ${q}</p><p><strong>A.</strong> ${a}</p></div>`
  })
  return `<div class="faq-list">${blocks.join('')}</div>`
}

function parsePrice(value: string | null) {
  return parseNumberLoose(value)
}

export async function collectTvListCards(limit = 3) {
  const cards = await collectTvListCardsWithBrowser(limit)
  if (!cards.length) {
    throw new Error('เปิดหน้าจอไม่ขึ้น: ไม่พบรายการสินค้าจากหน้า TVs')
  }
  return cards.slice(0, limit)
}

export async function parseTvDetail(detailUrl: string) {
  const log = createImportLogger('parse-detail')
  log.step(`fetch ${detailUrl}`)

  let html: string
  try {
    html = await fetchPdpHtml(detailUrl)
  }
  catch (error: unknown) {
    const err = error as { status?: number, statusCode?: number, message?: string }
    const status = err.status ?? err.statusCode ?? 'unknown'
    log.error(`fetch failed url=${detailUrl} status=${status} ${err.message ?? ''}`)
    throw error
  }

  const pageText = stripTags(html)

  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const name = titleMatch ? stripTags(titleMatch[1]) : null

  const skuFromUrl = detailUrl.match(/\/([^/]+)\/lgsubscribe\/?$/i)?.[1] ?? null
  const skuMatch = pageText.match(/(?:รุ่น|Model)\s*([A-Z0-9-]{5,})/i)
  const sku = (skuFromUrl || skuMatch?.[1] || '').toUpperCase() || null

  log.done(`fetch sku=${sku ?? '?'} name=${name ?? '?'}`)

  const priceTokens = [...pageText.matchAll(/฿\s?[\d,]+(?:\.\d+)?/g)].map(m => m[0])
  const basePrice = parsePrice(priceTokens[0] ?? null)
  const fullPrice = parsePrice(priceTokens[1] ?? null)

  const imageUrls = extractPdpImageUrls(html, { limit: 20 })
  if (!imageUrls.length) {
    log.warn(`no product images extracted from PDP — check HTML patterns for ${detailUrl}`)
  }
  else {
    log.info(`extracted ${imageUrls.length} product image(s) from PDP`)
  }

  const detailFields = sanitizeImportedDetailFields({
    description: extractSectionHtml(html, /(?:รายละเอียดสินค้า|Product Description)/i),
    key_features:
      extractKeyFeatureListHtml(html)
      ?? extractSectionHtml(html, /(?:คุณลักษณะที่สำคัญ|Key Features)/i),
    features:
      extractPdpOverviewSectionHtml(html)
      ?? extractSectionHtml(html, /(?:คุณสมบัติ|Features)/i),
    specifications:
      extractPdpSpecsSectionHtml(html)
      ?? extractSectionHtml(html, /(?:สเปค|ข้อมูลจำเพาะ|Specification)/i),
    faq_html: buildFaqHtmlFromText(html),
  })

  return {
    source_url: detailUrl,
    name,
    sku,
    image_urls: imageUrls,
    image_url: imageUrls[0] ?? null,
    base_price: basePrice,
    full_price: fullPrice,
    headline: (pageText.match(/ยิ่งซับมาก ยิ่งลดมาก!|โปรโมชั่น[^.]*\./) || [])[0] ?? null,
    ...detailFields,
  }
}

