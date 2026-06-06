import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Locator, Page } from 'playwright'
import { createImportLogger } from './lgImportLog'
import { LG_VARIANT_SWATCH_SELECTOR, resolveLgProductSku, skuFromLgModelId } from './lgSubscriptionSources'

function loadBrowserHelpers() {
  const candidates = [
    join(dirname(fileURLToPath(import.meta.url)), 'lgListCardDomScrape.browser.mjs'),
    join(process.cwd(), 'server/utils/lgListCardDomScrape.browser.mjs'),
  ]
  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, 'utf8').replace(/^export /gm, '')
    }
  }
  throw new Error('ไม่พบ lgListCardDomScrape.browser.mjs')
}

const BROWSER_HELPERS = loadBrowserHelpers()

function evalOnCard<T>(card: Locator, helperName: string): Promise<T> {
  const fn = new Function('el', `${BROWSER_HELPERS}\nreturn ${helperName}(el)`)
  return card.evaluate(fn as (el: HTMLElement) => T)
}

function evalOnCardWithArg<T>(card: Locator, helperName: string, arg: string): Promise<T> {
  const fn = new Function('el', 'arg', `${BROWSER_HELPERS}\nreturn ${helperName}(el, arg)`)
  return card.evaluate(fn as (el: HTMLElement, a: string) => T, arg)
}

export type DomCardRaw = {
  detailUrl: string
  name: string | null
  sku: string | null
  discountedPrice: number | null
  fullPrice: number | null
  lgModelId?: string | null
  variantLabel?: string | null
  /** การ์ด PLP เดียวกัน (หลายขนาดจอ) */
  variantGroupKey?: string | null
  /** URL ชุดรายละเอียดร่วม — มักเป็นปุ่ม subscribe หลังเลือก swatch แรกที่โหลดได้ */
  sharedDetailUrl?: string | null
}

export function normalizeLgDetailHref(href: string) {
  const trimmed = href.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http')) return trimmed.replace(/\/$/, '')
  return `https://www.lg.com${trimmed.startsWith('/') ? '' : '/'}${trimmed}`.replace(/\/$/, '')
}

/** คีย์กลุ่ม variant จาก path ก่อน slug รุ่น เช่น th/tv-soundbars/nano-4k-uhd */
export function variantGroupKeyFromDetailUrl(url: string) {
  const normalized = normalizeLgDetailHref(url)
  if (!normalized) return ''
  try {
    const parts = new URL(normalized).pathname.split('/').filter(Boolean)
    const subIdx = parts.findIndex(p => p.toLowerCase() === 'lgsubscribe')
    if (subIdx < 2) return ''
    return parts.slice(0, subIdx - 1).join('/').toLowerCase()
  }
  catch {
    return ''
  }
}

export function hasVisibleCardPricesFn() {
  const fn = new Function(`${BROWSER_HELPERS}\nreturn hasVisibleCardPrices()`)
  return fn as () => boolean
}

const SWATCH_WAIT_MS = 15000
const SWATCH_STABLE_READS = 2

function lgModelIdsMatch(a: string | null | undefined, b: string) {
  const fn = new Function('a', 'b', `${BROWSER_HELPERS}\nreturn modelIdsMatch(a, b)`)
  return Boolean(fn(a, b))
}

async function cardSelectionMatches(card: Locator, modelId: string) {
  const active = await evalOnCard<string | null>(card, 'readActiveSwatchModelId')
  if (lgModelIdsMatch(active, modelId)) return true
  return evalOnCardWithArg<boolean>(card, 'subscribeHrefMatchesModel', modelId)
}

/** รอ swatch active (หรือปุ่ม subscribe ชี้รุ่นถูก) + ราคาคงที่ */
async function waitForSwatchSelection(
  card: Locator,
  page: Page,
  modelId: string,
): Promise<{ discountedPrice: number | null, fullPrice: number | null } | null> {
  const deadline = Date.now() + SWATCH_WAIT_MS
  let stableHits = 0
  let lastMonthly: number | null = null

  while (Date.now() < deadline) {
    const selected = await cardSelectionMatches(card, modelId)
    const prices = await evalOnCard<{ discountedPrice: number | null, fullPrice: number | null }>(card, 'readNeoCardPrices')
    const monthly = prices.discountedPrice

    if (selected && monthly !== null) {
      if (monthly === lastMonthly) stableHits += 1
      else stableHits = 1
      lastMonthly = monthly
      if (stableHits >= SWATCH_STABLE_READS) return prices
    }
    else {
      stableHits = 0
      lastMonthly = null
    }
    await page.waitForTimeout(280)
  }

  return null
}

async function waitForCardSwatches(card: Locator, page: Page) {
  const swatchLocator = card.locator(LG_VARIANT_SWATCH_SELECTOR)
  await swatchLocator.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(400)
}

async function selectSwatchOnCard(
  card: Locator,
  page: Page,
  modelId: string,
  log: ReturnType<typeof createImportLogger>,
  cardLabel: string,
) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const clicked = await evalOnCardWithArg<boolean>(card, 'clickSwatchOnCard', modelId)
    if (!clicked) {
      log.warn(`${cardLabel} modelId=${modelId} — swatch button not found (try ${attempt}/3)`)
      return null
    }
    await page.waitForTimeout(450)
    const prices = await waitForSwatchSelection(card, page, modelId)
    if (prices) return prices
    log.warn(`${cardLabel} modelId=${modelId} — selection not confirmed (try ${attempt}/3)`)
    await page.waitForTimeout(600)
  }
  return null
}

function pickDetailHref(
  swatchHref: string | undefined,
  buttonHref: string | undefined,
  fallbackHref: string,
) {
  if (swatchHref) return normalizeLgDetailHref(swatchHref)
  if (buttonHref) return normalizeLgDetailHref(buttonHref)
  return normalizeLgDetailHref(fallbackHref)
}

/**
 * ทีวี PLP: คลิก swatch → อ่านป้าย + ราคา + URL จากปุ่ม subscribe (ไม่สร้าง URL จาก SKU)
 */
export async function scrapeTvPlpVariants(
  page: Page,
  options?: { maxUniqueSkus?: number },
): Promise<DomCardRaw[]> {
  const log = createImportLogger('plp-scrape')
  const rows: DomCardRaw[] = []
  const seenSkus = new Set<string>()
  const maxUniqueSkus = options?.maxUniqueSkus
  const cards = page.locator('li.c-product-list__item.neo-card')
  const cardCount = await cards.count()

  const trackSku = (sku: string | null | undefined) => {
    if (!sku) return seenSkus.size
    seenSkus.add(sku.toUpperCase())
    return seenSkus.size
  }

  const limitReached = () => maxUniqueSkus != null && maxUniqueSkus > 0 && seenSkus.size >= maxUniqueSkus

  log.info(`scraping ${cardCount} PLP card(s)${maxUniqueSkus ? ` (stop at ${maxUniqueSkus} SKU)` : ''}`)

  for (let i = 0; i < cardCount; i += 1) {
    if (limitReached()) {
      log.info(`reached SKU limit ${maxUniqueSkus} — stop card scrape`)
      break
    }
    log.step(`card ${i + 1}/${cardCount}`)
    const card = cards.nth(i)
    const shared = await evalOnCard<{ detailUrl: string, name: string | null, sku: string | null } | null>(card, 'readNeoCardShared')
    if (!shared?.detailUrl) {
      log.warn(`card ${i + 1}/${cardCount} skipped — no detail URL`)
      continue
    }

    const groupKey = variantGroupKeyFromDetailUrl(shared.detailUrl) || `plp-card-${i}`
    const cardRowsStart = rows.length

    await card.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {})
    await waitForCardSwatches(card, page)

    let swatchMeta = await evalOnCard<{ modelId: string, label: string, detailUrl?: string }[]>(card, 'readSwatchMetaFromCard')
    if (!swatchMeta.length) {
      await page.waitForTimeout(1200)
      swatchMeta = await evalOnCard<{ modelId: string, label: string, detailUrl?: string }[]>(card, 'readSwatchMetaFromCard')
    }

    if (!swatchMeta.length) {
      const prices = await evalOnCard<{ discountedPrice: number | null, fullPrice: number | null }>(card, 'readNeoCardPrices')
      const detailUrl = normalizeLgDetailHref(shared.detailUrl)
      const titleSku = await evalOnCard<string | null>(card, 'readNeoCardModelSku')
      const slugMatch = detailUrl.match(/\/([^/]+)\/lgsubscribe\/?$/i)
      const slugSku = slugMatch?.[1] ? skuFromLgModelId(slugMatch[1]) : ''
      // slug ใน URL แม่นที่สุด (65qned80bsa) — ชื่อการ์ดมักเหลือแค่ QNED80
      const sku = slugSku || resolveLgProductSku(null, titleSku) || resolveLgProductSku(null, shared.sku) || null
      if (!sku) {
        log.warn(`card ${i + 1}/${cardCount} no swatches and no SKU — skip`)
        continue
      }
      const inchFromName = shared.name?.match(/ทีวี\s*(\d+)\s*"/i)?.[1]
      rows.push({
        detailUrl,
        sharedDetailUrl: detailUrl,
        variantGroupKey: groupKey,
        name: shared.name,
        sku,
        variantLabel: inchFromName ? `${inchFromName} inch` : null,
        discountedPrice: prices.discountedPrice,
        fullPrice: prices.fullPrice,
      })
      trackSku(sku)
      log.done(`card ${i + 1}/${cardCount} no swatches → 1 row sku=${sku} url=${detailUrl} (total ${rows.length})`)
      if (limitReached()) break
      continue
    }

    log.info(`card ${i + 1}/${cardCount} ${swatchMeta.length} swatch(es) group=${groupKey}`)
    const seenModelIds = new Set<string>()
    for (let j = 0; j < swatchMeta.length; j += 1) {
      if (limitReached()) break
      const { modelId, label, detailUrl: swatchHref } = swatchMeta[j]!
      if (!modelId || seenModelIds.has(modelId)) continue
      seenModelIds.add(modelId)

      const cardLabel = `card ${i + 1}/${cardCount} swatch ${j + 1}`
      let prices = await selectSwatchOnCard(card, page, modelId, log, cardLabel)
      if (!prices) {
        log.warn(`${cardLabel} sku=${skuFromLgModelId(modelId)} — skip (swatch/price not confirmed)`)
        continue
      }
      const button = await evalOnCard<{ detailUrl: string, name: string | null, sku: string | null } | null>(
        card,
        'readNeoCardSubscribeButtonUrl',
      )
      const variantSku = resolveLgProductSku(modelId, button?.sku)
      const detailUrl = pickDetailHref(swatchHref, button?.detailUrl, shared.detailUrl)
      if (!variantSku) {
        log.warn(`card ${i + 1} swatch ${j + 1} modelId=${modelId} — invalid SKU, skip`)
        continue
      }
      if (!detailUrl) {
        log.warn(`card ${i + 1} swatch ${j + 1} sku=${variantSku} — no detail URL, skip`)
        continue
      }

      rows.push({
        detailUrl,
        variantGroupKey: groupKey,
        name: button?.name || shared.name,
        sku: variantSku,
        lgModelId: modelId,
        variantLabel: label || null,
        discountedPrice: prices.discountedPrice,
        fullPrice: prices.fullPrice,
      })
      trackSku(variantSku)
      const activeAfter = await evalOnCard<string | null>(card, 'readActiveSwatchModelId')
      log.info(
        `card ${i + 1}/${cardCount} swatch ${j + 1} → sku=${variantSku} price=${prices.discountedPrice ?? '?'} label=${label || '?'} active=${activeAfter?.split('.')[0] ?? '?'}`,
      )
    }

    const cardRows = rows.slice(cardRowsStart)
    const sharedDetailUrl = cardRows.find(r => r.detailUrl)?.detailUrl
      || normalizeLgDetailHref(shared.detailUrl)
    for (const row of cardRows) {
      row.sharedDetailUrl = sharedDetailUrl
    }

    log.done(`card ${i + 1}/${cardCount} → ${cardRows.length} variant(s) sharedDetail=${sharedDetailUrl ?? '?'}`)
  }

  log.info(`scrape complete — ${rows.length} row(s) from ${cardCount} card(s)`)
  return rows
}
