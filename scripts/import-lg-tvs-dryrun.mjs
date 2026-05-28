/**
 * LG TVs dry-run importer.
 *
 * - Crawl TVs list pages with firstResult pagination
 * - Collect product detail URLs (/lgsubscribe)
 * - Parse key product fields from each detail page
 * - Save report JSON + markdown under ./tmp
 *
 * Run:
 *   node scripts/import-lg-tvs-dryrun.mjs
 *
 * Note:
 *   First run may require browser install:
 *   npx playwright install chromium
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const TVS_URL = 'https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE'
const PAGE_STEP = 9
const PAGE_LIMIT = 20

function toAbs(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `https://www.lg.com${url.startsWith('/') ? '' : '/'}${url}`
}

function parsePrice(value) {
  if (!value) return null
  const num = value.replace(/[^\d.]/g, '')
  if (!num) return null
  return Number(num)
}

function unique(list) {
  return [...new Set(list.filter(Boolean))]
}

async function collectTvDetailUrls(page) {
  const urls = new Set()
  for (let i = 0; i < PAGE_LIMIT; i++) {
    const firstResult = i * PAGE_STEP
    const url = firstResult === 0 ? TVS_URL : `${TVS_URL}&firstResult=${firstResult}`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
    await page.waitForTimeout(2000)
    for (const label of ['Accept all', 'Reject All', 'ยอมรับทั้งหมด', 'ยอมรับทั้งหมด']) {
      const btn = page.getByRole('button', { name: label }).first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => {})
        await page.waitForTimeout(800)
        break
      }
    }
    await page.waitForSelector('a[href*="/lgsubscribe"]', { timeout: 12000 }).catch(() => {})

    const pageUrls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.getAttribute('href') || '')
        .filter(href => href.includes('/lgsubscribe') && !href.includes('#'))
    })

    const normalized = unique(pageUrls.map(toAbs))
    let added = 0
    for (const u of normalized) {
      if (!urls.has(u)) {
        urls.add(u)
        added += 1
      }
    }

    // stop when this page has no product cards
    if (normalized.length === 0) break
    // or when no new URLs found after first page
    if (i > 0 && added === 0) break
  }
  return [...urls]
}

async function parseDetail(page, detailUrl) {
  await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForTimeout(1800)
  for (const label of ['Accept all', 'Reject All', 'ยอมรับทั้งหมด']) {
    const btn = page.getByRole('button', { name: label }).first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {})
      await page.waitForTimeout(600)
      break
    }
  }

  return await page.evaluate((url) => {
    const text = (el) => (el?.textContent || '').trim()

    const h1 = document.querySelector('h1')
    const title = text(h1)
    const pageText = (document.body?.innerText || '').replace(/\s+/g, ' ')
    const sku = (title.match(/รุ่น\s*([A-Z0-9-]+)/i)?.[1]
      || pageText.match(/รุ่น\s*([A-Z0-9-]+)/i)?.[1]
      || '')

    const priceTokens = [...(document.body?.innerText || '').matchAll(/฿\s?[\d,]+(?:\.\d+)?/g)].map(m => m[0])
    const basePriceText = priceTokens[0] ?? ''
    const fullPriceText = priceTokens[1] ?? ''

    const pickSectionHtml = (headingRegex) => {
      const all = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,strong,p,span,div,li'))
      const heading = all.find(el => headingRegex.test((el.textContent || '').trim()))
      if (!heading) return null
      const chunks = []
      let node = heading.nextElementSibling
      let steps = 0
      while (node && steps < 20) {
        const t = (node.textContent || '').trim()
        if (/^(คุณลักษณะที่สำคัญ|คุณสมบัติ|สเปค|ข้อมูลจำเพาะ|Specification|Features)$/i.test(t)) break
        chunks.push(node.outerHTML || t)
        node = node.nextElementSibling
        steps += 1
      }
      return chunks.join('\n').trim() || null
    }

    const imageUrls = Array.from(document.querySelectorAll('img'))
      .map(img => img.getAttribute('src') || '')
      .filter(src => /\/th\/images\//.test(src) || /\/w_\d+\/h_\d+/.test(src))
      .map(src => src.startsWith('http') ? src : `https://www.lg.com${src.startsWith('/') ? '' : '/'}${src}`)

    return {
      source_url: url,
      name: title || null,
      sku: sku || null,
      image_urls: [...new Set(imageUrls)],
      image_url: imageUrls[0] ?? null,
      headline: pageText.match(/ยิ่งซับมาก ยิ่งลดมาก!|โปรโมชั่น[^\\n]*/)?.[0] ?? null,
      description: pickSectionHtml(/รายละเอียดสินค้า|รายละเอียด/i),
      key_features: pickSectionHtml(/คุณลักษณะที่สำคัญ/i),
      features: pickSectionHtml(/คุณสมบัติ/i),
      specifications: pickSectionHtml(/สเปค|ข้อมูลจำเพาะ|specification/i),
      base_price_text: basePriceText || null,
      full_price_text: fullPriceText || null,
    }
  }, detailUrl)
}

function mapToProductFields(parsed) {
  return {
    name: parsed.name,
    sku: parsed.sku,
    headline: parsed.headline,
    image_url: parsed.image_url,
    image_urls: parsed.image_urls,
    base_price: parsePrice(parsed.base_price_text),
    full_price: parsePrice(parsed.full_price_text),
    description: parsed.description,
    key_features: parsed.key_features,
    features: parsed.features,
    specifications: parsed.specifications,
    source_url: parsed.source_url,
  }
}

function buildMarkdownReport(mappedRows) {
  const total = mappedRows.length
  const missingSku = mappedRows.filter(r => !r.sku).length
  const missingName = mappedRows.filter(r => !r.name).length
  const missingPrice = mappedRows.filter(r => !r.base_price).length

  const lines = [
    '# LG TVs Dry-Run Report',
    '',
    `- Total products: ${total}`,
    `- Missing sku: ${missingSku}`,
    `- Missing name: ${missingName}`,
    `- Missing base_price: ${missingPrice}`,
    '',
    '## Items',
    '',
  ]

  for (const row of mappedRows) {
    lines.push(`- ${row.name || '(no name)'} | SKU: ${row.sku || '-'} | base_price: ${row.base_price ?? '-'} | ${row.source_url}`)
  }

  return lines.join('\n')
}

async function main() {
  let browser
  try {
    browser = await chromium.launch({ headless: true })
  }
  catch {
    // Fallback for environments where Playwright-managed binaries are unavailable.
    browser = await chromium.launch({ headless: true, channel: 'chrome' })
  }
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('Collecting TV detail URLs...')
    const detailUrls = await collectTvDetailUrls(page)
    console.log(`Found ${detailUrls.length} URLs`)

    const parsed = []
    for (const url of detailUrls) {
      console.log(`Parse: ${url}`)
      try {
        const item = await parseDetail(page, url)
        parsed.push(item)
      }
      catch (error) {
        parsed.push({ source_url: url, error: String(error) })
      }
    }

    const mapped = parsed.map(mapToProductFields)
    const reportMd = buildMarkdownReport(mapped)

    const outDir = resolve(process.cwd(), 'tmp')
    await mkdir(outDir, { recursive: true })
    const jsonPath = resolve(outDir, 'lg-tv-dryrun.json')
    const mdPath = resolve(outDir, 'lg-tv-dryrun-report.md')

    await writeFile(jsonPath, JSON.stringify({ generated_at: new Date().toISOString(), items: mapped }, null, 2), 'utf8')
    await writeFile(mdPath, reportMd, 'utf8')

    console.log(`Saved JSON: ${jsonPath}`)
    console.log(`Saved MD: ${mdPath}`)
  }
  finally {
    await context.close()
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
