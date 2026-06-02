/**
 * ทดสอบ catalog จริง — ต้องมี dev server: npm run dev
 * node scripts/verify-tv-catalog.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3000'
const lgSlug = process.argv[3] || 'tvs'
const url = `${base.replace(/\/$/, '')}/api/admin/import/catalog?lgSlug=${encodeURIComponent(lgSlug)}`

const REQUIRED_SKUS = [
  'OLED77C6PSA',
  'OLED65C6PSA',
  'OLED48C6PSA',
  '65NU855BPSA',
  '43NU855BPSA',
  '65QNED80BSA',
  '55QNED80BSA',
  '85QNED80BSA',
]

const MIN_ITEMS = 8

function fail(msg) {
  console.error('FAIL:', msg)
  process.exit(1)
}

async function main() {
  console.log('GET', url, `(lgSlug=${lgSlug}, timeout 5min)`)
  const started = Date.now()
  const res = await fetch(url, { signal: AbortSignal.timeout(300000) })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  }
  catch {
    fail(`non-JSON response (${res.status}): ${text.slice(0, 500)}`)
  }

  if (!res.ok || data.error) {
    fail(data.message || data.statusMessage || `HTTP ${res.status}`)
  }

  const items = data.items || []
  console.log(`OK ${res.status} in ${((Date.now() - started) / 1000).toFixed(1)}s — ${items.length} item(s)\n`)

  if (items.length < MIN_ITEMS) {
    fail(`expected at least ${MIN_ITEMS} items, got ${items.length}`)
  }

  const bySku = new Map(items.map(i => [i.sku?.toUpperCase(), i]))
  const missing = REQUIRED_SKUS.filter(sku => !bySku.has(sku))
  if (missing.length) {
    fail(`missing SKU(s): ${missing.join(', ')}`)
  }

  for (const item of items) {
    if (!item.source_url?.includes('/lgsubscribe')) {
      fail(`${item.sku} — source_url missing /lgsubscribe: ${item.source_url}`)
    }
    if (item.base_price == null || item.base_price <= 0) {
      fail(`${item.sku} — missing base_price`)
    }
  }

  const oled77 = bySku.get('OLED77C6PSA')
  const oled65 = bySku.get('OLED65C6PSA')
  const oled48 = bySku.get('OLED48C6PSA')
  if (oled77?.base_price === oled65?.base_price) {
    fail(`OLED77 and OLED65 same price (${oled77?.base_price}) — swatch prices likely stale`)
  }
  if (oled65?.base_price === oled48?.base_price) {
    fail(`OLED65 and OLED48 same price (${oled65?.base_price})`)
  }

  const prices = new Set(items.map(i => i.base_price))
  if (prices.size < 4) {
    fail(`too few distinct prices (${prices.size}) — possible duplicate price bug`)
  }

  console.log('SKU'.padEnd(16), 'size'.padEnd(8), 'price/mo', 'lgsubscribe')
  console.log('-'.repeat(60))
  for (const sku of REQUIRED_SKUS) {
    const i = bySku.get(sku)
    console.log(
      sku.padEnd(16),
      (i.variant_label || '-').padEnd(8),
      String(i.base_price).padStart(7),
      i.source_url?.includes('/lgsubscribe') ? 'yes' : 'NO',
    )
  }

  console.log(`\nPASS — ${items.length} items, ${REQUIRED_SKUS.length} required SKUs, prices differ across OLED sizes`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
