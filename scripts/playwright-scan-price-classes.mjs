import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const URL = 'https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE'

async function launchBrowser(headless) {
  try {
    return await chromium.launch({
      headless,
      slowMo: 60,
      args: ['--disable-blink-features=AutomationControlled'],
    })
  }
  catch {
    return await chromium.launch({
      channel: 'chrome',
      headless,
      slowMo: 60,
      args: ['--disable-blink-features=AutomationControlled'],
    })
  }
}

async function main() {
  const headless = process.env.HEADLESS === '1'
  const outDir = resolve(process.cwd(), 'tmp')
  await mkdir(outDir, { recursive: true })

  const browser = await launchBrowser(headless)
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
    window.chrome = window.chrome || { runtime: {} }
  })
  const page = await context.newPage()

  try {
    console.log(`[scan] open: ${URL}`)
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.waitForTimeout(2500)

    // Cookie popup may block interactions.
    for (const label of ['Accept all', 'ยอมรับทั้งหมด']) {
      const btn = page.getByRole('button', { name: label }).first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => {})
        await page.waitForTimeout(1000)
        break
      }
    }

    let hasPrice = false
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await page.waitForFunction(() => {
        const nodes = Array.from(document.querySelectorAll('.neo-price--price .cell-price'))
        return nodes.some((node) => /\d/.test((node.textContent || '').trim()))
      }, { timeout: 30000 }).then(() => {
        hasPrice = true
      }).catch(() => {})

      if (hasPrice) break
      console.log(`[scan] retry ${attempt}/3 no rendered price yet`)
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
      await page.waitForTimeout(2500)
    }

    const report = await page.evaluate(() => {
      const text = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim()
      const parseNum = (raw) => {
        const cleaned = String(raw || '').replace(/[^\d.]/g, '')
        if (!cleaned) return null
        const n = Number(cleaned)
        return Number.isFinite(n) ? n : null
      }

      const anchors = Array.from(document.querySelectorAll('a[href*="/lgsubscribe"]'))
      const rows = []
      for (const anchor of anchors) {
        const href = (anchor.getAttribute('href') || '').trim()
        if (!href) continue
        const card = anchor.closest('li, article, .c-product-item, .c-product-tile, .cmp-product-list__item') || anchor.parentElement
        if (!card) continue

        const baseNode = card.querySelector('.neo-price--price .cell-price')
        const fullNode = card.querySelector('.neo-price--price .cell-after del')
        const noteNode = card.querySelector('.neo-price--price') || card

        rows.push({
          href,
          title: text(card.querySelector('h1,h2,h3,h4,.cmp-product-item__title,.c-product-item__name')),
          classesFound: {
            neoPrice: Boolean(card.querySelector('.neo-price--price')),
            cellPrice: Boolean(baseNode),
            cellAfterDel: Boolean(fullNode),
          },
          extracted: {
            baseRaw: text(baseNode),
            baseNumber: parseNum(text(baseNode)),
            fullRaw: text(fullNode),
            fullNumber: parseNum(text(fullNode)),
            noteSnippet: text(noteNode).slice(0, 200),
          },
        })
      }

      return {
        totalCardsByAnchor: anchors.length,
        cardsWithAnyPriceClass: rows.filter((r) => r.classesFound.neoPrice || r.classesFound.cellPrice || r.classesFound.cellAfterDel).length,
        rows,
      }
    })

    const outPath = resolve(outDir, 'price-class-scan.json')
    await writeFile(outPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      hasPriceRendered: hasPrice,
      ...report,
    }, null, 2), 'utf8')

    console.log(`[scan] hasPriceRendered: ${hasPrice}`)
    console.log(`[scan] cards from anchors: ${report.totalCardsByAnchor}`)
    console.log(`[scan] cards with price classes: ${report.cardsWithAnyPriceClass}`)
    console.log(`[scan] saved: ${outPath}`)

    await page.waitForTimeout(3000)
  }
  finally {
    await context.close()
    await browser.close()
  }
}

main().catch((error) => {
  console.error('[scan] failed:', error)
  process.exit(1)
})
