import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const TARGET_URL = 'https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE'
const COVEO_SEARCH_URL = 'https://lgcorporationproduction0fxcu0qx.org.coveo.com/rest/search/v2?organizationId=lgcorporationproduction0fxcu0qx'
const COVEO_SEARCH_PAYLOAD = {
  locale: 'th-TH',
  tab: 'CT52000129',
  firstResult: 0,
  numberOfResults: 24,
  aq: '@ec_locale_code=="TH" AND  @ec_category_id=="CT52000129"',
  searchHub: 'TH-B2C-Subscribe-Listing',
}
const OUT_DIR = resolve(process.cwd(), 'tmp')
const ARTIFACTS = {
  requestHeaders: resolve(OUT_DIR, 'coveo.browser.request-headers.json'),
  requestBody: resolve(OUT_DIR, 'coveo.browser.request-body.json'),
  status: resolve(OUT_DIR, 'coveo.browser.status.txt'),
  responseHeaders: resolve(OUT_DIR, 'coveo.browser.response-headers.json'),
  responseBody: resolve(OUT_DIR, 'coveo.browser.body.json'),
  summary: resolve(OUT_DIR, 'coveo.browser.capture-summary.json'),
}

function isCoveoRequest(request) {
  if (request.method() !== 'POST') return false
  const url = request.url().toLowerCase()
  return url.includes('coveo') || url.includes('/rest/search')
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  }
  catch {
    return null
  }
}

function detectPriceLikeKeys(result0) {
  if (!result0 || typeof result0 !== 'object') return []
  const keyRegex = /(price|monthly|amount|cost|payment|installment|บาท|baht)/i
  return Object.keys(result0).filter((key) => keyRegex.test(key))
}

function buildSummary(status, responseJson) {
  const results = Array.isArray(responseJson?.results) ? responseJson.results : []
  const first = results[0]
  return {
    status,
    hasResults: results.length > 0,
    numberOfResults: typeof responseJson?.totalCountFiltered === 'number'
      ? responseJson.totalCountFiltered
      : typeof responseJson?.totalCount === 'number'
        ? responseJson.totalCount
        : results.length,
    firstResultKeys: first && typeof first === 'object' ? Object.keys(first) : [],
    detectedPriceLikeKeys: detectPriceLikeKeys(first),
  }
}

async function maybeDismissCookieBanner(page) {
  for (const label of ['Accept all', 'Reject All', 'ยอมรับทั้งหมด']) {
    const btn = page.getByRole('button', { name: label }).first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {})
      await page.waitForTimeout(700)
      return
    }
  }
}

async function main() {
  const hardStop = setTimeout(() => {
    console.error('Capture timeout: exceeded 70 seconds')
    process.exit(1)
  }, 70000)
  await mkdir(OUT_DIR, { recursive: true })

  let browser
  try {
    browser = await chromium.launch({ headless: true })
  }
  catch {
    browser = await chromium.launch({ headless: true, channel: 'chrome' })
  }

  const context = await browser.newContext()
  const page = await context.newPage()

  let coveoResponsePromiseResolve
  const coveoResponsePromise = new Promise((resolveCapture) => {
    coveoResponsePromiseResolve = resolveCapture
  })
  let captured = false

  page.on('response', async (response) => {
    if (captured) return
    const request = response.request()
    if (!isCoveoRequest(request)) return
    captured = true
    coveoResponsePromiseResolve({ request, response })
  })

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await maybeDismissCookieBanner(page)
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})

  let captureResult = await Promise.race([
    coveoResponsePromise,
    page.waitForTimeout(12000).then(() => null),
  ])

  if (!captureResult) {
    // Fallback: execute Coveo fetch in page context using browser session/cookies.
    await page.evaluate(async ({ endpoint, payload }) => {
      const asRecord = (value) => (value && typeof value === 'object' ? value : {})
      const tokenCandidates = new Set()
      const pushTokenLike = (value) => {
        if (typeof value !== 'string') return
        const token = value.trim()
        if (!token || token.length < 20) return
        if (!/^[A-Za-z0-9\-_.=:+/]+$/.test(token)) return
        tokenCandidates.add(token)
      }
      try {
        pushTokenLike(window.__COVEO_TOKEN__)
        const maybeObjects = [
          window.__NUXT__,
          window.__NEXT_DATA__,
          window.LG,
          window.coveo,
          window.__PRELOADED_STATE__,
        ]
        for (const obj of maybeObjects) {
          if (!obj || typeof obj !== 'object') continue
          const stack = [obj]
          let guard = 0
          while (stack.length && guard < 1200) {
            const current = stack.pop()
            guard += 1
            if (!current) continue
            for (const [k, v] of Object.entries(asRecord(current))) {
              if (/token/i.test(k)) pushTokenLike(v)
              if (v && typeof v === 'object') stack.push(v)
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

      const authHeaders = ['', ...[...tokenCandidates].slice(0, 2)].map((token) => (
        token ? { authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}
      ))
      for (const authHeader of authHeaders) {
        try {
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), 3000)
          const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            signal: controller.signal,
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              'x-requested-with': 'XMLHttpRequest',
              ...authHeader,
            },
            body: JSON.stringify(payload),
          })
          clearTimeout(timer)
          if (response.ok) break
        }
        catch {
          // try next candidate
        }
      }
    }, { endpoint: COVEO_SEARCH_URL, payload: COVEO_SEARCH_PAYLOAD })

    captureResult = await Promise.race([
      coveoResponsePromise,
      page.waitForTimeout(15000).then(() => null),
    ])
  }

  if (!captureResult) {
    throw new Error('No Coveo POST request observed from browser session within timeout.')
  }

  const { request, response } = captureResult
  const requestHeaders = await request.allHeaders()
  const requestBodyText = request.postData() || ''
  const requestBodyJson = safeJsonParse(requestBodyText)

  const status = response.status()
  const responseHeaders = await response.allHeaders()
  const responseText = await response.text()
  const responseJson = safeJsonParse(responseText)

  const responseBodyToSave = responseJson ?? { rawText: responseText }
  const summary = buildSummary(status, responseJson)

  await writeFile(ARTIFACTS.requestHeaders, JSON.stringify(requestHeaders, null, 2), 'utf8')
  await writeFile(
    ARTIFACTS.requestBody,
    JSON.stringify(requestBodyJson ?? { rawText: requestBodyText }, null, 2),
    'utf8',
  )
  await writeFile(ARTIFACTS.status, `${status}\n`, 'utf8')
  await writeFile(ARTIFACTS.responseHeaders, JSON.stringify(responseHeaders, null, 2), 'utf8')
  await writeFile(ARTIFACTS.responseBody, JSON.stringify(responseBodyToSave, null, 2), 'utf8')
  await writeFile(ARTIFACTS.summary, JSON.stringify(summary, null, 2), 'utf8')

  console.log(`status=${status}`)
  console.log(`hasResults=${summary.hasResults}`)
  console.log(`numberOfResults=${summary.numberOfResults}`)
  console.log(`detectedPriceLikeKeys=${summary.detectedPriceLikeKeys.join(',')}`)

  await context.close()
  await browser.close()
  clearTimeout(hardStop)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
