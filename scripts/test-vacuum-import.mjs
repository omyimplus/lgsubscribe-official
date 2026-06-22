/**
 * ทดสอบ import URL — เครื่องดูดฝุ่น cordless
 * npx tsx scripts/test-vacuum-import.mjs
 * npx tsx scripts/test-vacuum-import.mjs --dump
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectTvListCardsWithBrowser } from '../server/utils/lgTvImport.ts'
import { launchLgBrowser } from '../server/utils/lgBrowserLaunch.ts'
import { createImportLogger } from '../server/utils/lgImportLog.ts'
import { normalizeLgCategoryListUrl, resolveCategorySlugForUrlImport } from '../server/utils/lgCategoryUrl.ts'

const url = 'https://www.lg.com/th/vacuum-cleaner/cordless-vacuum-cleaner/'
const HELPERS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../server/utils/lgListCardDomScrape.browser.mjs'),
  'utf8',
).replace(/^export /gm, '')

async function dumpCards() {
  const listUrl = normalizeLgCategoryListUrl(url)
  const log = createImportLogger('vacuum-dump')
  const browser = await launchLgBrowser(log)
  const page = await browser.newPage()
  await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(2500)
  for (const label of ['ยอมรับทั้งหมด', 'Accept all']) {
    const btn = page.getByRole('button', { name: label }).first()
    if (await btn.isVisible().catch(() => false)) await btn.click().catch(() => {})
  }
  await page.waitForSelector('li.c-product-list__item.neo-card', { timeout: 60000 })

  const data = await page.evaluate((helpers) => {
    const fn = new Function(`${helpers}
      return Array.from(document.querySelectorAll('li.c-product-list__item.neo-card')).map((el, i) => ({
        i,
        title: (el.querySelector('h3')?.textContent || '').replace(/\\s+/g, ' ').trim(),
        badge: hasSubscriptionBadge(el),
        shared: readNeoCardShared(el),
        modelSku: readNeoCardModelSku(el),
        copySku: (() => {
          const btn = el.querySelector('.neo-card--sku .btn-copy')
          return btn?.getAttribute('data-clipboard-text') || btn?.textContent?.trim() || null
        })(),
        ufnHref: el.querySelector('.neo-card--ufn a[href]')?.getAttribute('href') || null,
        imgHref: el.querySelector('.neo-card--img a[href]')?.getAttribute('href') || null,
        swatches: readSwatchMetaFromCard(el).length,
      }))
    `)
    return fn()
  }, HELPERS)

  console.log(JSON.stringify(data, null, 2))
  await browser.close()
}

async function main() {
  const listUrl = normalizeLgCategoryListUrl(url)
  console.log('URL:', listUrl)

  try {
    console.log('Category (list only):', resolveCategorySlugForUrlImport(listUrl, []))
  }
  catch (e) {
    console.log('Category error (list only):', e instanceof Error ? e.message : e)
  }

  const cards = await collectTvListCardsWithBrowser(500, listUrl, {
    listPath: new URL(listUrl).pathname,
    allowEmpty: true,
    subscriptionBadgeOnly: false,
    skipCardPrices: true,
  })

  console.log('\nCards scraped:', cards.length)
  for (const c of cards) {
    console.log(`  ${c.model_key} | ${c.name?.slice(0, 55)} | ${c.source_url}`)
  }

  try {
    console.log('\nCategory (with product urls):', resolveCategorySlugForUrlImport(listUrl, cards.map(c => c.source_url)))
  }
  catch (e) {
    console.log('Category error:', e instanceof Error ? e.message : e)
  }
}

if (process.argv.includes('--dump')) {
  dumpCards().catch(err => { console.error(err); process.exit(1) })
}
else {
  main().catch(err => { console.error(err); process.exit(1) })
}
