/**
 * เทียบจำนวน — หน้า LG จริง vs scrape (session เดียว)
 * npx tsx scripts/test-url-import-count.mjs [url]
 */
import { launchLgBrowser } from '../server/utils/lgBrowserLaunch.ts'
import { createImportLogger } from '../server/utils/lgImportLog.ts'
import { scrapeTvPlpVariants } from '../server/utils/lgListCardDomScrape.ts'
import { lgListPathFromUrl, normalizeLgCategoryListUrl } from '../server/utils/lgCategoryUrl.ts'
import { subscriptionListPageUrl } from '../server/utils/lgSubscriptionSources.ts'

const DEFAULT_URL = 'https://www.lg.com/th/tv-soundbars/all-tvs-soundbars/'
const url = process.argv[2] || DEFAULT_URL

async function waitCards(page, log, label) {
  for (const label of ['ยอมรับทั้งหมด', 'Accept all']) {
    const btn = page.getByRole('button', { name: label }).first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {})
      await page.waitForTimeout(1200)
      break
    }
  }
  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    const n = await page.locator('li.c-product-list__item.neo-card').count()
    if (n > 0) return n
    await page.waitForTimeout(1000)
  }
  log.warn(`${label} — no cards after 60s`)
  return 0
}

async function countReal(page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll('li.c-product-list__item.neo-card')]
    const byText = cards.filter(el => /subscription/i.test(el.innerText || ''))
    const byOurHelper = cards.filter((el) => {
      const nodes = el.querySelectorAll('[class*="badge" i], [class*="flag" i], .neo-flag, .flag, .label, .tag')
      return [...nodes].some(n => /subscription/i.test((n.textContent || '')))
    })
    return {
      totalCards: cards.length,
      subscriptionByInnerText: byText.length,
      subscriptionByBadgeClass: byOurHelper.length,
      sampleTitles: byText.slice(0, 5).map(el =>
        (el.querySelector('h3')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 55),
      ),
    }
  })
}

async function main() {
  const listUrl = normalizeLgCategoryListUrl(url)
  console.log('='.repeat(72))
  console.log('Compare:', listUrl)
  console.log('='.repeat(72))

  const log = createImportLogger('compare')
  const browser = await launchLgBrowser(log)
  const page = await browser.newPage()

  try {
    await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.waitForTimeout(2000)
    const cardCount = await waitCards(page, log, 'navigate')
    const real = await countReal(page)

    console.log('\n[หน้า LG จริง — browser session เดียว]')
    console.log(`  การ์ดทั้งหมด:              ${real.totalCards} (locator: ${cardCount})`)
    console.log(`  Subscription (innerText):  ${real.subscriptionByInnerText}`)
    console.log(`  Subscription (badge class): ${real.subscriptionByBadgeClass}`)
    if (real.sampleTitles.length) {
      console.log('  ตัวอย่าง:', real.sampleTitles.join(' | '))
    }

    console.log('\n[Scrape ระบบเรา — subscriptionBadgeOnly, session เดียว]')
    const rows = await scrapeTvPlpVariants(page, {
      subscriptionBadgeOnly: true,
      skipCardPrices: true,
      maxUniqueSkus: 500,
      pageIndex: 0,
    })
    const groups = new Set(rows.map(r => r.plpCardKey || r.variantGroupKey || r.sku))
    console.log(`  SKU:    ${rows.length}`)
    console.log(`  กลúp:  ${groups.size}`)
    if (rows.length) {
      console.log(`  SKU ตัวอย่าง: ${rows.slice(0, 8).map(r => r.sku).join(', ')}`)
    }

    console.log('\n[สรุป]')
    if (real.totalCards === 0) {
      console.log('  ⚠ โหลดการ์ดไม่สำเร็จ — LG อาจ block หรือหน้าโหลดช้า')
    }
    else if (real.subscriptionByInnerText === 0 && rows.length === 0) {
      console.log('  ⚠ หน้านี้ไม่พบข้อความ Subscription ใน browser — อาจไม่มี badge หรือ DOM ต่างจากที่คาด')
    }
    else if (groups.size === real.subscriptionByInnerText || rows.length > 0) {
      console.log(`  หน้า LG มี Subscription ~${real.subscriptionByInnerText} การ์ด → scrape ได้ ${rows.length} SKU (${groups.size} กลúp)`)
    }
    else {
      console.log(`  ✗ ไม่ตรง: LG ${real.subscriptionByInnerText} การ์ด vs scrape ${rows.length} SKU`)
    }
  }
  finally {
    await browser.close()
  }

  // baseline: subscription PLP ทีวี
  if (url.includes('all-tvs-soundbars')) {
    console.log('\n' + '='.repeat(72))
    console.log('[อ้างอิง] Subscribe PLP ทีวี — ระบบเดิม')
    const subUrl = subscriptionListPageUrl('https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE', 0)
    const log2 = createImportLogger('compare-sub')
    const b2 = await launchLgBrowser(log2)
    const p2 = await b2.newPage()
    try {
      await p2.goto(subUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
      await p2.waitForTimeout(2000)
      await waitCards(p2, log2, 'sub-tvs')
      const real2 = await countReal(p2)
      const rows2 = await scrapeTvPlpVariants(p2, { maxUniqueSkus: 500, pageIndex: 0 })
      console.log(`  การ์ด PLP: ${real2.totalCards} · scrape SKU: ${rows2.length} (ไม่กรอง badge)`)
    }
    finally {
      await b2.close()
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
