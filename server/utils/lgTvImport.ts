const TVS_LIST_URL = 'https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE'
const COVEO_SEARCH_URL = 'https://lgcorporationproduction0fxcu0qx.org.coveo.com/rest/search/v2?organizationId=lgcorporationproduction0fxcu0qx'
const COVEO_SEARCH_PAYLOAD = {
  locale: 'th-TH',
  tab: 'CT52000129',
  firstResult: 0,
  numberOfResults: 24,
  aq: '@ec_locale_code=="TH" AND  @ec_category_id=="CT52000129"',
  searchHub: 'TH-B2C-Subscribe-Listing',
}
const RETRIEVE_PRODUCT_LIST_URL = 'https://www.lg.com/ncms/asia/api/v1/proxy/retrieveProductList?locale=TH'
const RETRIEVE_PRODUCT_LIST_PAYLOAD = {
  bizType: 'B2C',
  isMember: 'Y',
  productList: [
    {
      skuList: 'OLED65C6PSA.ATM.EATH.TH.C,65QNED80BSA.ATM.EATH.TH.C,65NU855BPSA.ATM.EATH.TH.C,55QNED80BSA.ATM.EATH.TH.C,43NU855BPSA.ATM.EATH.TH.C,85QNED80BSA.ATM.EATH.TH.C',
    },
  ],
  subscribeProduct: 'N',
  pageType: 'PLP',
} as const
const PRICE_RENDER_MAX_RETRIES = 3
const PRICE_RENDER_WAIT_TIMEOUT_MS = 60000

function isValidTvDetailUrl(url: string) {
  // Keep only real PDP subscription URLs, e.g.
  // /th/tv-soundbars/oled-evo/oled77c6psa/lgsubscribe
  if (!url.includes('/lgsubscribe')) return false
  if (url.includes('/subscription/tvs/lgsubscribe')) return false
  const m = url.match(/^https:\/\/www\.lg\.com\/th\/([^/]+)\/([^/]+)\/([^/]+)\/lgsubscribe\/?$/i)
  return Boolean(m)
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

function normalizeModelKey(url: string) {
  const normalized = normalizeUrl(url)
  const matched = normalized.match(/\/([^/]+)\/lgsubscribe\/?$/i)
  return matched?.[1]?.toUpperCase() ?? null
}

type TvListCard = {
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
}

type MappedWithKeys = {
  card: TvListCard | null
  usedKeys: string[]
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
  const sourceUrl = toLgSubscribeUrl(detailHref)
  if (!sourceUrl || !isValidTvDetailUrl(sourceUrl)) return null
  const modelCandidate = String(raw?.sku || raw?.modelName || '').trim().toUpperCase() || null

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
    model_key: modelCandidate || normalizeModelKey(sourceUrl),
    name: raw?.name ? String(raw.name).trim() : null,
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
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function pickStringWithKeys(source: Record<string, unknown>, candidates: string[]) {
  for (const key of candidates) {
    const v = source[key]
    if (typeof v === 'string' && v.trim()) {
      return { value: v.trim(), key }
    }
  }
  return { value: null, key: null }
}

function pickNumberWithKeys(source: Record<string, unknown>, candidates: string[]) {
  for (const key of candidates) {
    const n = parseNumberLoose(source[key] as any)
    if (n !== null) return { value: n, key }
  }
  return { value: null, key: null }
}

function pickNumberByKeyPattern(source: Record<string, unknown>, patterns: RegExp[]) {
  const keys = Object.keys(source)
  for (const key of keys) {
    if (!patterns.some(pattern => pattern.test(key))) continue
    const parsed = parseNumberLoose(source[key] as any)
    if (parsed !== null) return { value: parsed, key }
  }
  return { value: null, key: null }
}

function mapCoveoResult(rawResult: Record<string, unknown>): MappedWithKeys {
  const raw = asRecord(rawResult.raw)
  const modelCandidates = [
    raw.ec_sku,
    raw.ec_partnumber,
    raw.ec_model_name,
    raw.model_key,
    raw.modelName,
  ]
    .filter(v => typeof v === 'string')
    .map(v => String(v).trim().toUpperCase())
    .filter(Boolean)
  const modelKey = modelCandidates[0] ?? null

  const urlPick = pickStringWithKeys(raw, [
    'ec_product_url',
    'ec_url',
    'ec_uri',
    'product_url',
    'url',
  ])
  const sourceUrl = toLgSubscribeUrl(urlPick.value)

  const titlePick = pickStringWithKeys(rawResult, ['title'])
  const rawTitlePick = pickStringWithKeys(raw, ['ec_name', 'ec_product_name', 'ec_title', 'ec_model_name'])
  const headlinePick = pickStringWithKeys(raw, ['ec_promo_text', 'ec_promotion_text', 'ec_headline'])
  const subNotePick = pickStringWithKeys(raw, ['ec_subscription_note', 'ec_promo_subtext', 'ec_price_text'])
  const purchaseOnlyLabelPick = pickStringWithKeys(raw, ['ec_purchase_only_label', 'ec_buy_label', 'ec_cta_label'])
  const purchaseOnlyUrlPick = pickStringWithKeys(raw, ['ec_purchase_only_url', 'ec_buy_url', 'ec_cta_url'])
  const looseTexts = collectStringValues(raw)
  const inferredHeadline = pickByRegex(looseTexts, [
    /ยิ่งซับมาก\s*ยิ่งลดมาก!?/i,
    /(?:promo|promotion|โปร).*(?:subscription|subscribe|เดือน|month)/i,
  ])
  const inferredSubNote = pickByRegex(looseTexts, [
    /(?:ส่วนลด|สิทธิพิเศษ|เฉพาะ).*?(?:12|เดือน|month|subscribe|subscription)/i,
    /12\s*(?:เดือน|month)/i,
  ])
  const inferredPurchaseLabel = pickByRegex(looseTexts, [
    /ซื้อขาด/i,
    /ซื้อ(?:เลย|ทันที)/i,
    /(?:buy\s*now|purchase\s*only|shop\s*now)/i,
  ])
  const inferredPurchaseUrl = collectUrlLikeValues(raw).find(url => !url.includes('/lgsubscribe')) || null

  const basePricePick = pickNumberWithKeys(raw, [
    'ec_sale_price',
    'ec_promo_price',
    'ec_subscription_price',
    'ec_monthly_price',
    'ec_price',
    'ec_discounted_price',
  ])
  const fullPricePick = pickNumberWithKeys(raw, [
    'ec_full_price',
    'ec_original_price',
    'ec_list_price',
    'ec_msrp',
    'ec_regular_price',
  ])
  const basePricePatternPick = basePricePick.value !== null
    ? { value: null, key: null }
    : pickNumberByKeyPattern(raw, [
        /(?:^|_)(?:sub(?:scribe|scription)?|monthly|rent|rental|discount|sale|promo|final|offer|member|best)(?:_|$)/i,
        /(?:^|_)(?:price|amount|fee)(?:_|$)/i,
      ])
  const fullPricePatternPick = fullPricePick.value !== null
    ? { value: null, key: null }
    : pickNumberByKeyPattern(raw, [
        /(?:^|_)(?:full|original|list|regular|before|normal|was|crossed|msrp)(?:_|$)/i,
      ])
  const warrantyPick = pickNumberWithKeys(raw, ['ec_warranty_years', 'ec_warranty'])

  const card: TvListCard = {
    source_url: sourceUrl,
    model_key: modelKey || normalizeModelKey(sourceUrl),
    name: titlePick.value || rawTitlePick.value || null,
    headline: headlinePick.value || inferredHeadline || null,
    base_price: basePricePick.value ?? basePricePatternPick.value,
    full_price: fullPricePick.value ?? fullPricePatternPick.value,
    warranty_years: warrantyPick.value ?? extractWarrantyYears(`${subNotePick.value ?? ''} ${headlinePick.value ?? ''} ${looseTexts.join(' ')}`),
    subscription_note: subNotePick.value || inferredSubNote || null,
    purchase_only_label: purchaseOnlyLabelPick.value || inferredPurchaseLabel || null,
    purchase_only_url: purchaseOnlyUrlPick.value ? normalizeUrl(purchaseOnlyUrlPick.value) : inferredPurchaseUrl,
  }

  const usedKeys = [
    urlPick.key,
    titlePick.key ? `result.${titlePick.key}` : null,
    rawTitlePick.key,
    headlinePick.key,
    subNotePick.key,
    purchaseOnlyLabelPick.key,
    purchaseOnlyUrlPick.key,
    basePricePick.key,
    basePricePatternPick.key,
    fullPricePick.key,
    fullPricePatternPick.key,
    warrantyPick.key,
  ].filter(Boolean) as string[]

  if (!card.source_url && !card.model_key) {
    return { card: null, usedKeys }
  }
  return { card, usedKeys }
}

function extractPriceKeys(raw: Record<string, unknown>) {
  return Object.keys(raw)
    .filter(key => /(price|msrp|monthly|amount|subscription|rental|fee|cost)/i.test(key))
    .sort((a, b) => a.localeCompare(b))
}

function mapRetrieveProductListItem(raw: Record<string, unknown>): TvListCard | null {
  const modelUrlPath = typeof raw.modelUrlPath === 'string' ? raw.modelUrlPath.trim() : ''
  const sourceUrl = modelUrlPath
    ? normalizeUrl(`${modelUrlPath.replace(/\/$/, '')}/lgsubscribe`)
    : ''
  if (!sourceUrl || !isValidTvDetailUrl(sourceUrl)) return null

  const modelName = typeof raw.modelName === 'string' ? raw.modelName.trim() : ''
  const userFriendlyName = typeof raw.userFriendlyName === 'string' ? raw.userFriendlyName.trim() : ''
  const promotionText = typeof raw.promotionText === 'string' ? raw.promotionText.trim() : ''
  const promotionLinkUrl = typeof raw.promotionLinkUrl === 'string' ? raw.promotionLinkUrl.trim() : ''
  const externalBuyUrl = typeof raw.wtbExternalLinkUrl === 'string' ? raw.wtbExternalLinkUrl.trim() : ''
  const purchaseOnlyUrl = normalizeUrl(promotionLinkUrl || externalBuyUrl || '')
  const priceCandidates = [
    raw.monthlyPrice,
    raw.subscriptionPrice,
    raw.discountPrice,
    raw.salePrice,
    raw.sellingPrice,
    raw.finalPrice,
    raw.price,
  ]
  const fullPriceCandidates = [
    raw.fullPrice,
    raw.originalPrice,
    raw.listPrice,
    raw.beforeDiscountPrice,
    raw.msrp,
  ]

  const stringValues = collectStringValues(raw)
  const inferredHeadline = pickByRegex(stringValues, [
    /ยิ่งซับมาก\s*ยิ่งลดมาก!?/i,
    /(?:promo|promotion|โปร).*(?:subscription|subscribe|เดือน|month)/i,
  ])
  const inferredSubNote = pickByRegex(stringValues, [
    /(?:ส่วนลด|สิทธิพิเศษ|เฉพาะ).*?(?:12|เดือน|month|subscribe|subscription)/i,
    /12\s*(?:เดือน|month)/i,
  ])
  const inferredPurchaseLabel = pickByRegex(stringValues, [
    /ซื้อขาด/i,
    /ซื้อ(?:เลย|ทันที)/i,
    /(?:buy\s*now|purchase\s*only|shop\s*now)/i,
  ])
  const inferredPurchaseUrl = collectUrlLikeValues(raw).find(url => !url.includes('/lgsubscribe')) || null
  const patternBasePrice = pickNumberByKeyPattern(raw, [
    /(?:^|_)(?:sub(?:scribe|scription)?|monthly|rent|rental|discount|sale|promo|final|offer|member|best)(?:_|$)/i,
    /(?:^|_)(?:price|amount|fee)(?:_|$)/i,
  ]).value
  const patternFullPrice = pickNumberByKeyPattern(raw, [
    /(?:^|_)(?:full|original|list|regular|before|normal|was|crossed|msrp)(?:_|$)/i,
  ]).value

  return {
    source_url: sourceUrl,
    model_key: modelName || normalizeModelKey(sourceUrl),
    name: userFriendlyName || modelName || null,
    headline: promotionText || inferredHeadline || null,
    base_price: normalizePrice(priceCandidates.map(v => parseNumberLoose(v as any)).find(v => v !== null) ?? patternBasePrice ?? null),
    full_price: normalizePrice(fullPriceCandidates.map(v => parseNumberLoose(v as any)).find(v => v !== null) ?? patternFullPrice ?? null),
    warranty_years: extractWarrantyYears(`${promotionText} ${userFriendlyName} ${stringValues.join(' ')}`),
    subscription_note: inferredSubNote,
    purchase_only_label: raw.buyNowUseFlag === 'Y' ? 'ซื้อขาด' : inferredPurchaseLabel,
    purchase_only_url: purchaseOnlyUrl || inferredPurchaseUrl || null,
  }
}

async function collectTvListCardsWithBrowser(limit = 3): Promise<TvListCard[]> {
  const { chromium } = await import('playwright')
  let browser
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    })
  }
  catch {
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled'],
    })
  }

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    viewport: { width: 1366, height: 900 },
    extraHTTPHeaders: {
      'accept-language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  })
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    Object.defineProperty(navigator, 'languages', { get: () => ['th-TH', 'th', 'en-US', 'en'] })
    Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' })
    ;(window as any).chrome = (window as any).chrome || { runtime: {} }
  })
  const page = await context.newPage()
  const networkCards: TvListCard[] = []
  const discoveredPriceKeys = new Set<string>()
  const discoveredCoveoKeys = new Set<string>()

  try {
    page.on('response', async (response) => {
      const responseUrl = response.url()
      if (responseUrl.includes('org.coveo.com/rest/search/v2')) {
        try {
          const payload = await response.json()
          const results = Array.isArray(payload?.results) ? payload.results : []
          for (const result of results) {
            const { card, usedKeys } = mapCoveoResult(asRecord(result))
            usedKeys.forEach(k => discoveredCoveoKeys.add(k))
            if (card) networkCards.push(card)
          }
        }
        catch {
          // ignore malformed/blocked network payloads
        }
      }
      if (!responseUrl.includes('retrieveProductList')) return
      try {
        const payload = await response.json()
        const extracted = await page.evaluate((data) => {
          const asText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
          const toNumber = (value: unknown) => {
            if (typeof value === 'number') return value
            if (typeof value !== 'string') return null
            const cleaned = value.replace(/[^\d.]/g, '')
            if (!cleaned) return null
            const n = Number(cleaned)
            return Number.isFinite(n) ? n : null
          }
          const pickPrice = (obj: Record<string, unknown>, keys: string[]) => {
            for (const key of keys) {
              if (key in obj) {
                const n = toNumber(obj[key])
                if (n !== null) return n
              }
            }
            return null
          }
          const nodes: Record<string, unknown>[] = []
          const walk = (value: unknown) => {
            if (!value) return
            if (Array.isArray(value)) {
              for (const item of value) walk(item)
              return
            }
            if (typeof value !== 'object') return
            const obj = value as Record<string, unknown>
            nodes.push(obj)
            for (const v of Object.values(obj)) walk(v)
          }
          walk(data)

          const results: any[] = []
          for (const node of nodes) {
            const href = asText(node.pdpUrl) || asText(node.productUrl) || asText(node.link) || asText(node.url)
            if (!href.includes('/lgsubscribe')) continue
            const values = Object.values(node).map(v => (typeof v === 'string' ? v : '')).filter(Boolean)
            const warrantyText = values.find(v => /(\d+)\s*(ปี|year)/i.test(v)) || ''
            const warrantyYearsMatch = warrantyText.match(/(\d+)\s*(ปี|year)/i)
            const warrantyYears = warrantyYearsMatch ? Number(warrantyYearsMatch[1]) : null

            const subscriptionNote = values.find(v => /12\s*(เดือน|month)|ส่วนลด/i.test(v)) || ''
            const purchaseOnlyLabel = values.find(v => /ซื้อขาด|purchase/i.test(v)) || ''

            results.push({
              detailUrl: href,
              name: asText(node.modelDisplayName) || asText(node.modelName) || asText(node.title) || null,
              headline: values.find(v => /ยิ่งซับมาก|ลดมาก/i.test(v)) || null,
              discountedPrice: pickPrice(node, ['subscriptionPrice', 'monthlyPrice', 'discountPrice', 'salePrice']),
              fullPrice: pickPrice(node, ['fullPrice', 'originalPrice', 'listPrice', 'beforeDiscountPrice']),
              warrantyYears,
              subscriptionNote: subscriptionNote || null,
              purchaseOnlyLabel: purchaseOnlyLabel || null,
              purchaseOnlyUrl: asText(node.purchaseOnlyUrl) || null,
            })
          }
          return results
        }, payload)
        for (const item of extracted) {
          const mapped = mapRawCard(item)
          if (mapped) networkCards.push(mapped)
        }
      }
      catch {
        // ignore malformed/blocked network payloads; DOM fallback still applies
      }
    })

    await page.goto(TVS_LIST_URL, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.waitForTimeout(2500)

    await page.evaluate(async ({ endpoint, payload }) => {
      try {
        await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
      }
      catch {
        // ignore; endpoint may still be triggered by page scripts
      }
    }, { endpoint: RETRIEVE_PRODUCT_LIST_URL, payload: RETRIEVE_PRODUCT_LIST_PAYLOAD })

    await page.waitForTimeout(3500)

    const coveoFetch = await page.evaluate(async ({ endpoint, payload }) => {
      const asRecord = (value: unknown): Record<string, unknown> => (
        value && typeof value === 'object' ? value as Record<string, unknown> : {}
      )
      const tokenCandidates = new Set<string>()
      const pushTokenLike = (value: unknown) => {
        if (typeof value !== 'string') return
        const token = value.trim()
        if (!token || token.length < 20) return
        if (!/^[A-Za-z0-9\-_.=:+/]+$/.test(token)) return
        tokenCandidates.add(token)
      }
      try {
        pushTokenLike((window as any).__COVEO_TOKEN__)
        const w = window as any
        const maybeObjects = [
          w.__NUXT__,
          w.__NEXT_DATA__,
          w.LG,
          w.coveo,
          w.__PRELOADED_STATE__,
        ]
        for (const obj of maybeObjects) {
          if (!obj || typeof obj !== 'object') continue
          const stack = [obj as Record<string, unknown>]
          let guard = 0
          while (stack.length && guard < 1200) {
            const current = stack.pop()
            guard += 1
            if (!current) continue
            for (const [k, v] of Object.entries(current)) {
              if (/token/i.test(k)) pushTokenLike(v)
              if (v && typeof v === 'object') stack.push(asRecord(v))
            }
          }
        }
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i)
          if (!key || !/token|coveo/i.test(key)) continue
          pushTokenLike(localStorage.getItem(key))
        }
        for (let i = 0; i < sessionStorage.length; i += 1) {
          const key = sessionStorage.key(i)
          if (!key || !/token|coveo/i.test(key)) continue
          pushTokenLike(sessionStorage.getItem(key))
        }
      }
      catch {
        // continue with unauthenticated attempt
      }

      const authHeaders = ['', ...tokenCandidates].map(token => (
        token ? { authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}
      ))
      for (const authHeader of authHeaders) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              'x-requested-with': 'XMLHttpRequest',
              ...authHeader,
            },
            body: JSON.stringify(payload),
          })
          if (!response.ok) continue
          const json = await response.json()
          return {
            ok: true,
            status: response.status,
            results: Array.isArray(json?.results) ? json.results : [],
          }
        }
        catch {
          // try another token candidate
        }
      }

      return { ok: false, status: 0, results: [] as unknown[] }
    }, { endpoint: COVEO_SEARCH_URL, payload: COVEO_SEARCH_PAYLOAD })
    if (coveoFetch?.ok && Array.isArray(coveoFetch.results)) {
      for (const result of coveoFetch.results) {
        const { card, usedKeys } = mapCoveoResult(asRecord(result))
        usedKeys.forEach(k => discoveredCoveoKeys.add(k))
        if (card) networkCards.push(card)
      }
    }

    const directApiProducts = await page.evaluate(async ({ endpoint, payload }) => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        if (!response.ok) return []
        const json = await response.json()
        if (!json || typeof json !== 'object') return []
        const root = json as Record<string, unknown>
        const productLists = Array.isArray(root.productLists) ? root.productLists : []
        const rows: Record<string, unknown>[] = []
        for (const listNode of productLists) {
          if (!listNode || typeof listNode !== 'object') continue
          const productList = (listNode as Record<string, unknown>).productList
          if (!Array.isArray(productList)) continue
          for (const product of productList) {
            if (!product || typeof product !== 'object') continue
            rows.push(product as Record<string, unknown>)
          }
        }
        return rows
      }
      catch {
        return []
      }
    }, { endpoint: RETRIEVE_PRODUCT_LIST_URL, payload: RETRIEVE_PRODUCT_LIST_PAYLOAD })
    for (const item of directApiProducts) {
      for (const key of extractPriceKeys(item)) discoveredPriceKeys.add(key)
      const mapped = mapRetrieveProductListItem(item)
      if (mapped) networkCards.push(mapped)
    }

    const extractDomCards = () => page.evaluate(() => {
      const parsePrice = (value: string) => {
        const cleaned = value.replace(/[^\d.]/g, '')
        if (!cleaned) return null
        const parsed = Number(cleaned)
        return Number.isFinite(parsed) ? parsed : null
      }
      const text = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim()
      const rows: any[] = []
      const cards = Array.from(document.querySelectorAll('li.c-product-list__item.neo-card'))

      for (const card of cards) {
        const primaryLink = card.querySelector('.neo-card--ufn a[href*="/lgsubscribe"]')
          || card.querySelector('.neo-card--img a[href*="/lgsubscribe"]')
          || card.querySelector('a[href*="/lgsubscribe"]')
        const href = (primaryLink?.getAttribute('href') || '').trim()
        if (!href) continue

        const cardText = text(card)
        if (!cardText) continue

        const selectorBasePrice = parsePrice(text(card?.querySelector('.neo-price--price .cell-price')))
        const selectorFullPrice = parsePrice(text(card?.querySelector('.neo-price--price .cell-after del')))
        const prices = [...cardText.matchAll(/฿\s?[\d,]+(?:\.\d+)?/g)].map(m => m[0])
        const infoItems = Array.from(card.querySelectorAll('.neo-card--info-box .info-items li .link-ti'))
          .map((node) => text(node))
          .filter(Boolean)
        const warrantyText = infoItems.find((line) => /(\d+)\s*(?:ปี|year)/i.test(line))
          || cardText.match(/(\d+\s*(?:ปี|year))/i)?.[1]
          || null
        const purchaseAnchor = card?.querySelector('.neo-card--info-box a[href]:not([href*="/lgsubscribe"])')
        const headline = text(card.querySelector('.neo-price--top .cell-info')) || null
        const subNote = infoItems.find((line) => /ส่วนลด\s*12\s*เดือนเท่านั้น|12\s*เดือน/i.test(line))
          || null
        const sku = text(card.querySelector('.neo-card--sku .btn-copy')) || null

        rows.push({
          detailUrl: href,
          name: text(card?.querySelector('h1,h2,h3,h4,.cmp-product-item__title,.c-product-item__name')) || null,
          sku,
          headline,
          discountedPrice: selectorBasePrice ?? parsePrice(prices[0] || ''),
          fullPrice: selectorFullPrice ?? parsePrice(prices[1] || ''),
          warrantyText,
          subscriptionNote: subNote,
          purchaseOnlyLabel: purchaseAnchor ? text(purchaseAnchor) : null,
          purchaseOnlyUrl: purchaseAnchor?.getAttribute('href') || null,
        })
      }

      return rows
    })

    let domCardsRaw: any[] = []
    for (let attempt = 1; attempt <= PRICE_RENDER_MAX_RETRIES; attempt += 1) {
      await page.waitForFunction(() => {
        const prices = Array.from(document.querySelectorAll('.neo-price--price .cell-price'))
        return prices.some((node) => /\d/.test((node.textContent || '').trim()))
      }, { timeout: PRICE_RENDER_WAIT_TIMEOUT_MS }).catch(() => false)

      domCardsRaw = await extractDomCards()
      const hasPrice = domCardsRaw.some(row => row.discountedPrice !== null || row.fullPrice !== null)
      if (hasPrice) break

      if (attempt < PRICE_RENDER_MAX_RETRIES) {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
        await page.waitForTimeout(2500)
      }
    }

    if (!domCardsRaw.some(row => row.discountedPrice !== null || row.fullPrice !== null)) {
      throw new Error('เปิดหน้าจอไม่ขึ้น: ไม่พบราคาในการ์ดสินค้าหลังลอง 3 รอบ')
    }

    // Deterministic precedence for list-level fields:
    // 1) DOM extraction values from visible product cards
    // 2) API/network card values (Coveo + retrieveProductList)
    // Detail page remains final fallback in tvs-draft endpoint.
    const merged = [...domCardsRaw.map(mapRawCard).filter(Boolean) as TvListCard[], ...networkCards]
    const uniqueByKey = new Map<string, TvListCard>()
    const buildIdentity = (card: TvListCard) => card.source_url || card.model_key || ''
    for (const card of merged) {
      const identity = buildIdentity(card)
      if (!identity) continue
      const prev = uniqueByKey.get(identity)
      if (!prev) {
        uniqueByKey.set(identity, card)
        continue
      }
      const mergedCard: TvListCard = {
        ...prev,
        ...card,
        source_url: card.source_url || prev.source_url,
        model_key: card.model_key || prev.model_key,
        name: prev.name || card.name,
        // Prefer non-zero price values. This allows DOM card prices to override API placeholders.
        base_price: normalizePrice(card.base_price) ?? normalizePrice(prev.base_price),
        full_price: normalizePrice(card.full_price) ?? normalizePrice(prev.full_price),
        headline: prev.headline ?? card.headline,
        subscription_note: prev.subscription_note ?? card.subscription_note,
        warranty_years: prev.warranty_years ?? card.warranty_years,
        purchase_only_label: prev.purchase_only_label ?? card.purchase_only_label,
        purchase_only_url: prev.purchase_only_url ?? card.purchase_only_url,
      }
      uniqueByKey.set(identity, mergedCard)
    }

    const output = [...uniqueByKey.values()]
      .filter(card => Boolean(card.source_url) && isValidTvDetailUrl(card.source_url))
      .slice(0, limit)
    if (!output.some(card => card.base_price !== null || card.full_price !== null)) {
      console.warn('[lgTvImport] retrieveProductList price-like keys:', [...discoveredPriceKeys].join(', ') || '(none)')
    }
    if (discoveredCoveoKeys.size) {
      console.warn('[lgTvImport] coveo mapped keys:', [...discoveredCoveoKeys].sort().join(', '))
    }
    return output
  }
  finally {
    await context.close()
    await browser.close()
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

function extractSectionHtml(html: string, headingRegex: RegExp) {
  const headingMatch = headingRegex.exec(html)
  if (!headingMatch || headingMatch.index === undefined) return null
  const after = html.slice(headingMatch.index + headingMatch[0].length)
  const endMatch = after.match(/<(h1|h2|h3|h4|h5)[^>]*>/i)
  const chunk = endMatch ? after.slice(0, endMatch.index) : after
  const cleaned = chunk.trim()
  return cleaned ? cleaned : null
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
  const html = await $fetch<string>(detailUrl, { responseType: 'text' })
  const pageText = stripTags(html)

  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const name = titleMatch ? stripTags(titleMatch[1]) : null

  const skuFromUrl = detailUrl.match(/\/([^/]+)\/lgsubscribe\/?$/i)?.[1] ?? null
  const skuMatch = pageText.match(/(?:รุ่น|Model)\s*([A-Z0-9-]{5,})/i)
  const sku = (skuFromUrl || skuMatch?.[1] || '').toUpperCase() || null

  const priceTokens = [...pageText.matchAll(/฿\s?[\d,]+(?:\.\d+)?/g)].map(m => m[0])
  const basePrice = parsePrice(priceTokens[0] ?? null)
  const fullPrice = parsePrice(priceTokens[1] ?? null)

  const imageUrls = [...new Set(
    [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)]
      .map(m => normalizeUrl(m[1]))
      .filter(src => src.includes('/th/images/') || src.includes('/w_') || src.includes('/h_')),
  )].slice(0, 20)

  return {
    source_url: detailUrl,
    name,
    sku,
    image_urls: imageUrls,
    image_url: imageUrls[0] ?? null,
    base_price: basePrice,
    full_price: fullPrice,
    headline: (pageText.match(/ยิ่งซับมาก ยิ่งลดมาก!|โปรโมชั่น[^.]*\./) || [])[0] ?? null,
    description: extractSectionHtml(html, /(?:รายละเอียดสินค้า|Product Description)/i),
    key_features: extractSectionHtml(html, /(?:คุณลักษณะที่สำคัญ|Key Features)/i),
    features: extractSectionHtml(html, /(?:คุณสมบัติ|Features)/i),
    specifications: extractSectionHtml(html, /(?:สเปค|ข้อมูลจำเพาะ|Specification)/i),
    faq_html: buildFaqHtmlFromText(html),
  }
}

