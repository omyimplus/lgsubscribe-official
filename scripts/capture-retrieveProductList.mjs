/**
 * จับ request/response retrieveProductList จากหน้า subscription TVs จริง
 * node scripts/capture-retrieveProductList.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const PLP_URL = 'https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE'
const OUT = resolve(process.cwd(), 'tmp/retrieveProductList-live-capture.json')

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

async function launchBrowser() {
  try {
    return await chromium.launch({
      headless: true,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    })
  }
  catch {
    return chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] })
  }
}

async function main() {
  await mkdir(resolve(process.cwd(), 'tmp'), { recursive: true })

  const browser = await launchBrowser()
  const context = await browser.newContext({
    userAgent: UA,
    locale: 'th-TH',
    viewport: { width: 1366, height: 900 },
  })
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })

  const page = await context.newPage()
  const captures = []

  page.on('request', (req) => {
    const url = req.url()
    if (!url.includes('retrieveProductList')) return
    captures.push({
      phase: 'request',
      url,
      method: req.method(),
      headers: req.headers(),
      postData: req.postData() || null,
    })
  })

  page.on('response', async (res) => {
    const url = res.url()
    if (!url.includes('retrieveProductList')) return
    let body = null
    try {
      body = await res.json()
    }
    catch {
      try {
        body = await res.text()
      }
      catch {
        body = null
      }
    }
    captures.push({
      phase: 'response',
      url,
      status: res.status(),
      headers: res.headers(),
      body,
    })
  })

  await page.goto(PLP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(3000)

  for (const label of ['ยอมรับทั้งหมด', 'Reject All', 'Accept all']) {
    const btn = page.getByRole('button', { name: label }).first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {})
      await page.waitForTimeout(4000)
      break
    }
  }

  await page.waitForSelector('li.c-product-list__item.neo-card', { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(5000)

  const pageMeta = await page.evaluate(() => ({
    title: document.title,
    cardCount: document.querySelectorAll('li.c-product-list__item.neo-card').length,
    hasAccessDenied: /access denied/i.test(document.title),
  }))

  const payload = {
    capturedAt: new Date().toISOString(),
    plpUrl: PLP_URL,
    pageMeta,
    captures,
  }

  await writeFile(OUT, JSON.stringify(payload, null, 2), 'utf8')
  console.log('saved:', OUT)
  console.log('page:', pageMeta)
  console.log('retrieveProductList events:', captures.length)

  await context.close()
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
