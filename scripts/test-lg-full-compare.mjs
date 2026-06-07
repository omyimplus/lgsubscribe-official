/**
 * เทสเทียบ LG จริงทุกหมวด — PLP เต็ม (limit 500) + ตรวจ group key + audit ข้อมูล
 *
 *   npx tsx scripts/test-lg-full-compare.mjs
 *   npx tsx scripts/test-lg-full-compare.mjs washers tvs   # เฉพาะบางหมวด
 *   npx tsx scripts/test-lg-full-compare.mjs --quick       # limit 30 ต่อหมวด (smoke)
 *
 * รายงาน: tmp/lg-full-compare.json + สรุปบน console
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import {
  getImportableLgSubscriptionSources,
  lgSubscriptionListPath,
} from '../server/utils/lgSubscriptionSources.ts'
import {
  collectTvListCardsWithBrowser,
} from '../server/utils/lgTvImport.ts'
import {
  variantGroupKeyFromDetailUrl,
  variantGroupKeyForPlpCard,
} from '../server/utils/lgListCardDomScrape.ts'

function parseVariantSort(label) {
  const m = label?.match(/(\d+)/)
  return m ? Number.parseInt(m[1], 10) : null
}

function deriveGroupDisplayName(name) {
  if (!name?.trim()) return 'ไม่มีชื่อ'
  return name.replace(/\s*รุ่น\s+[A-Z0-9]+.*$/i, '').trim() || name.trim()
}

function groupCatalogItems(items) {
  const map = new Map()
  for (const item of items) {
    const key = item.variant_group_key?.trim() || `sku:${item.sku}`
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }
  const groups = []
  for (const [groupKey, variants] of map) {
    const sorted = [...variants].sort((a, b) => {
      const sa = parseVariantSort(a.variant_label) ?? 9999
      const sb = parseVariantSort(b.variant_label) ?? 9999
      return sa - sb
    })
    groups.push({
      group_key: groupKey,
      display_name: deriveGroupDisplayName(sorted[0]?.name),
      products: sorted,
    })
  }
  return groups.sort((a, b) => a.display_name.localeCompare(b.display_name, 'th'))
}

const args = process.argv.slice(2)
const quick = args.includes('--quick')
const onlySlugs = args.filter(a => !a.startsWith('--')).map(s => s.toLowerCase())

const GROUP_KEY_CASES = [
  {
    url: 'https://www.lg.com/th/laundry/wash-tower/wt1410nhen/lgsubscribe',
    scope: 'model',
    expect: 'th/laundry/wash-tower/wt1410nhen',
  },
  {
    url: 'https://www.lg.com/th/laundry/wash-tower/wt1410nhen/lgsubscribe',
    scope: 'family',
    expect: 'th/laundry/wash-tower',
  },
  {
    url: 'https://www.lg.com/th/tv-soundbars/oled-evo/oled65c6psa/lgsubscribe',
    scope: 'family',
    expect: 'th/tv-soundbars/oled-evo',
  },
  {
    url: 'https://www.lg.com/th/washers/wt1410nhen/lgsubscribe',
    scope: 'model',
    expect: 'th/washers/wt1410nhen',
  },
]

function auditCard(card) {
  const missing = []
  if (!card?.source_url) missing.push('detail_url')
  if (!card?.model_key) missing.push('sku')
  if (!card?.name) missing.push('name')
  if (card?.base_price == null) missing.push('price')
  if (!card?.variant_group_key) missing.push('group_key')
  return missing
}

function detectOverGrouping(items, groups, plpCardCount) {
  const warnings = []
  if (!items.length) return warnings

  if (plpCardCount > 0 && groups.length !== plpCardCount) {
    warnings.push(`card-group-mismatch: PLP ${plpCardCount} การ์ด vs ${groups.length} กลุ่ม`)
  }

  const uniqueKeys = new Set(items.map(i => i.variant_group_key).filter(Boolean))
  if (items.length >= 4 && uniqueKeys.size === 1) {
    warnings.push(`over-group: ${items.length} SKU อยู่กลุ่มเดียว (${[...uniqueKeys][0]})`)
  }

  const topGroup = groups[0]
  if (topGroup && items.length >= 6 && topGroup.products.length > items.length * 0.6) {
    warnings.push(
      `suspicious-group: กลุ่ม "${topGroup.display_name}" มี ${topGroup.products.length}/${items.length} SKU`,
    )
  }

  const shallowKeys = items
    .map(i => i.variant_group_key)
    .filter(k => k && /^th\/[^/]+$/.test(k))
  if (shallowKeys.length) {
    warnings.push(`shallow-group-key: ${[...new Set(shallowKeys)].slice(0, 3).join(', ')}`)
  }

  return warnings
}

function runGroupKeyUnitTests() {
  const failures = []
  for (const c of GROUP_KEY_CASES) {
    const got = variantGroupKeyFromDetailUrl(c.url, c.scope ?? 'family')
    if (got !== c.expect) {
      failures.push({ url: c.url, expect: c.expect, got })
    }
  }
  return failures
}

const sources = getImportableLgSubscriptionSources().filter(
  s => !onlySlugs.length || onlySlugs.includes(s.lgSlug),
)

if (!sources.length) {
  console.error('ไม่พบหมวดที่ระบุ — ใช้ lgSlug เช่น washers, tvs')
  process.exit(1)
}

const limit = quick ? 30 : 500
const started = Date.now()
const unitFailures = runGroupKeyUnitTests()

console.log('='.repeat(72))
console.log(`LG full compare — ${sources.length} หมวด, limit=${limit}${quick ? ' (quick)' : ''}`)
console.log('='.repeat(72))

if (unitFailures.length) {
  console.log('\n[unit] variantGroupKeyFromDetailUrl FAIL:')
  for (const f of unitFailures) {
    console.log(`  ✗ ${f.url}`)
    console.log(`    expect: ${f.expect}`)
    console.log(`    got:    ${f.got}`)
  }
}
else {
  console.log('\n[unit] variantGroupKeyFromDetailUrl OK')
}

const results = []

for (let i = 0; i < sources.length; i += 1) {
  const source = sources[i]
  const label = `${source.lgSlug} (${source.label})`
  console.log(`\n[${i + 1}/${sources.length}] ${label}`)
  const row = {
    lgSlug: source.lgSlug,
    label: source.label,
    categorySlug: source.categorySlug,
    listUrl: source.listUrl,
    status: 'ERROR',
    skuCount: 0,
    plpCardCount: 0,
    groupCount: 0,
    multiVariantGroups: 0,
    missingFields: 0,
    warnings: [],
    sampleSkus: [],
    sampleGroups: [],
    error: null,
    ms: 0,
  }
  const t0 = Date.now()

  try {
    const cards = await collectTvListCardsWithBrowser(limit, source.listUrl, {
      lgSlug: source.lgSlug,
      listPath: lgSubscriptionListPath(source.lgSlug),
      allowEmpty: true,
    })

    if (!cards.length) {
      row.status = 'EMPTY'
      row.error = 'ไม่มีสินค้าบน PLP'
      row.ms = Date.now() - t0
      results.push(row)
      console.log('  → EMPTY')
      continue
    }

    const plpCardCount = new Set(
      cards.map(c => c.plp_card_key).filter(Boolean),
    ).size

    const items = cards.map(card => ({
      sku: (card.model_key || '').toUpperCase(),
      name: card.name,
      source_url: card.source_url,
      base_price: card.base_price,
      variant_label: card.variant_label ?? null,
      plp_card_key: card.plp_card_key ?? null,
      variant_group_key: card.variant_group_key
        ?? variantGroupKeyFromDetailUrl(card.shared_detail_url || card.source_url, 'model'),
    })).filter(i => i.sku)

    const groups = groupCatalogItems(items)
    const auditMissing = items.reduce((n, item) => n + auditCard({
      model_key: item.sku,
      source_url: item.source_url,
      name: item.name,
      base_price: item.base_price,
      variant_group_key: item.variant_group_key,
    }).length, 0)

    row.plpCardCount = plpCardCount
    row.skuCount = items.length
    row.groupCount = groups.length
    row.multiVariantGroups = groups.filter(g => g.products.length > 1).length
    row.missingFields = auditMissing
    row.warnings = detectOverGrouping(items, groups, plpCardCount)
    row.sampleSkus = items.slice(0, 5).map(i => i.sku)
    row.sampleGroups = groups.slice(0, 5).map(g => ({
      key: g.group_key,
      name: g.display_name,
      skus: g.products.map(p => p.sku),
    }))

    const hasFail = row.warnings.some(w =>
      w.startsWith('over-group') || w.startsWith('card-group-mismatch'),
    )
    const hasWarn = row.warnings.length > 0 || auditMissing > 0
    row.status = hasFail ? 'FAIL' : hasWarn ? 'WARN' : 'OK'
    row.ms = Date.now() - t0

    console.log(
      `  → ${row.status} cards=${row.plpCardCount} ${row.skuCount} SKU · ${row.groupCount} กลุ่ม`
      + ` (${row.multiVariantGroups} กลุ่มหลายขนาด) · ${(row.ms / 1000).toFixed(1)}s`,
    )
    if (row.warnings.length) console.log(`     warn: ${row.warnings.join(' | ')}`)
    if (auditMissing) console.log(`     missing fields (count): ${auditMissing}`)
  }
  catch (err) {
    row.error = err instanceof Error ? err.message : String(err)
    row.status = 'ERROR'
    row.ms = Date.now() - t0
    console.log(`  → ERROR ${row.error}`)
  }

  results.push(row)
}

const elapsed = Math.round((Date.now() - started) / 1000)
const ok = results.filter(r => r.status === 'OK').length
const warn = results.filter(r => r.status === 'WARN').length
const fail = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length
const empty = results.filter(r => r.status === 'EMPTY').length

console.log('\n' + '='.repeat(72))
console.log('SUMMARY', { unitFail: unitFailures.length, ok, warn, fail, empty, elapsedSec: elapsed })
console.log('='.repeat(72))
console.log(
  'lgSlug'.padEnd(22)
  + 'status'.padEnd(8)
  + 'SKU'.padEnd(6)
  + 'groups'.padEnd(8)
  + 'notes',
)
for (const r of results) {
  const note = r.error || r.warnings.join('; ') || '-'
  console.log(
    r.lgSlug.padEnd(22)
    + r.status.padEnd(8)
    + String(r.skuCount).padEnd(6)
    + String(r.groupCount).padEnd(8)
    + note.slice(0, 60),
  )
}

const report = {
  startedAt: new Date(started).toISOString(),
  elapsedSec: elapsed,
  options: { limit, quick, onlySlugs },
  unitTests: { failures: unitFailures },
  summary: { ok, warn, fail, empty, unitFail: unitFailures.length },
  results,
}

try {
  mkdirSync('tmp', { recursive: true })
  const outPath = 'tmp/lg-full-compare.json'
  writeFileSync(outPath, JSON.stringify(report, null, 2))
  console.log(`\nFull report: ${outPath}`)
}
catch {
  // ignore
}

const exitCode = unitFailures.length || fail || empty ? 1 : 0
process.exit(exitCode)
