/**
 * Smoke test ทุกหมวด LG Subscribe — หมวดละ 1 SKU (PLP + PDP)
 * ใช้เวลานาน (~2–5 นาที/หมวด) ต้องมี Chrome สำหรับ Playwright
 *
 *   npx tsx scripts/test-all-category-samples.mjs
 *   npx tsx scripts/test-all-category-samples.mjs tvs washers   # เฉพาะบางหมวด
 */
import { writeFileSync } from 'node:fs'
import {
  getImportableLgSubscriptionSources,
  lgSubscriptionListPath,
} from '../server/utils/lgSubscriptionSources.ts'
import {
  collectTvListCardsWithBrowser,
  parseTvDetail,
} from '../server/utils/lgTvImport.ts'

const onlySlugs = process.argv.slice(2).map(s => s.toLowerCase())
const sources = getImportableLgSubscriptionSources().filter(
  s => !onlySlugs.length || onlySlugs.includes(s.lgSlug),
)

function auditCard(card) {
  const missing = []
  if (!card?.source_url) missing.push('plp:detail_url')
  if (!card?.model_key) missing.push('plp:sku')
  if (!card?.name) missing.push('plp:name')
  if (card?.base_price == null) missing.push('plp:monthly_price')
  return missing
}

function auditPdp(parsed) {
  const missing = []
  if (!parsed?.name) missing.push('pdp:name')
  if (!parsed?.sku) missing.push('pdp:sku')
  if (!parsed?.image_urls?.length) missing.push('pdp:images')
  if (!parsed?.description && !parsed?.key_features && !parsed?.features) {
    missing.push('pdp:content')
  }
  if (!parsed?.specifications) missing.push('pdp:specs')
  if (parsed?.base_price == null) missing.push('pdp:price')
  return missing
}

async function probeImage(url, referer) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        referer,
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0.0.0 Safari/537.36',
      },
    })
    return res.ok ? res.status : res.status
  }
  catch {
    return 'ERR'
  }
}

function statusFromMissing(missing) {
  if (!missing.length) return 'OK'
  if (missing.some(m => m.startsWith('pdp:images') || m.startsWith('plp:detail'))) return 'FAIL'
  return 'WARN'
}

const results = []
const started = Date.now()

console.log(`Testing ${sources.length} categories (1 SKU each)…\n`)

for (let i = 0; i < sources.length; i += 1) {
  const source = sources[i]
  const label = `${source.lgSlug} (${source.label})`
  console.log(`[${i + 1}/${sources.length}] ${label}`)
  const row = {
    lgSlug: source.lgSlug,
    label: source.label,
    categorySlug: source.categorySlug,
    listUrl: source.listUrl,
    status: 'ERROR',
    sku: null,
    detailUrl: null,
    plpPrice: null,
    pdpImages: 0,
    imageProbe: null,
    missing: [],
    error: null,
    ms: 0,
  }
  const t0 = Date.now()

  try {
    const cards = await collectTvListCardsWithBrowser(1, source.listUrl, {
      lgSlug: source.lgSlug,
      listPath: lgSubscriptionListPath(source.lgSlug),
      allowEmpty: true,
    })

    if (!cards.length) {
      row.status = 'EMPTY'
      row.missing = ['plp:no_items']
      row.error = 'ไม่มีสินค้าบนหน้ารายการ'
      results.push(row)
      console.log('  → EMPTY (no PLP items)\n')
      row.ms = Date.now() - t0
      continue
    }

    const card = cards[0]
    row.sku = card.model_key
    row.detailUrl = card.source_url
    row.plpPrice = card.base_price

    const plpMissing = auditCard(card)
    const parsed = await parseTvDetail(card.source_url)
    const pdpMissing = auditPdp(parsed)
    row.pdpImages = parsed.image_urls?.length ?? 0

    if (parsed.image_urls?.[0]) {
      row.imageProbe = await probeImage(parsed.image_urls[0], card.source_url)
    }

    row.missing = [...plpMissing, ...pdpMissing]
    row.status = statusFromMissing(row.missing)
    console.log(
      `  → ${row.status} sku=${row.sku} plp฿=${row.plpPrice ?? '-'} images=${row.pdpImages} probe=${row.imageProbe ?? '-'}`,
    )
    if (row.missing.length) console.log(`     missing: ${row.missing.join(', ')}`)
    console.log('')
  }
  catch (err) {
    row.error = err instanceof Error ? err.message : String(err)
    row.status = 'ERROR'
    console.log(`  → ERROR ${row.error}\n`)
  }

  row.ms = Date.now() - t0
  results.push(row)
}

const elapsed = Math.round((Date.now() - started) / 1000)
const ok = results.filter(r => r.status === 'OK').length
const warn = results.filter(r => r.status === 'WARN').length
const fail = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length
const empty = results.filter(r => r.status === 'EMPTY').length

console.log('\n' + '='.repeat(72))
console.log('SUMMARY', { ok, warn, fail, empty, elapsedSec: elapsed })
console.log('='.repeat(72))
console.log(
  'lgSlug'.padEnd(20)
  + 'status'.padEnd(8)
  + 'SKU'.padEnd(18)
  + 'img'.padEnd(5)
  + 'missing',
)
for (const r of results) {
  console.log(
    r.lgSlug.padEnd(20)
    + r.status.padEnd(8)
    + (r.sku || '-').slice(0, 16).padEnd(18)
    + String(r.pdpImages).padEnd(5)
    + (r.missing.join(', ') || r.error || '-'),
  )
}

const outPath = 'tmp/category-import-smoke-test.json'
try {
  writeFileSync(outPath, JSON.stringify({ elapsed, results }, null, 2))
  console.log(`\nFull report: ${outPath}`)
}
catch {
  // tmp may not exist
}

if (fail > 0 || empty > 0) process.exit(1)
