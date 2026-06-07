/**
 * เทส import grouping จากจำนวนการ์ด PLP จริง
 * หลักการ: 1 การ์ดบน LG = 1 กลุ่ม (ยกเว้นการ์ดที่มี swatch หลายขนาด → หลาย SKU ในกลุ่มเดียว)
 * ชื่อคล้ายกันแต่คนละรหัส ต้องไม่ถูกรวมกลุ่ม
 *
 *   npx tsx scripts/test-lg-import-card-groups.mjs
 *   npx tsx scripts/test-lg-import-card-groups.mjs washers tvs
 *   npx tsx scripts/test-lg-import-card-groups.mjs --quick
 *
 * รายงาน: tmp/lg-import-card-groups.json
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import {
  getImportableLgSubscriptionSources,
  lgSubscriptionListPath,
} from '../server/utils/lgSubscriptionSources.ts'
import { collectTvListCardsWithBrowser } from '../server/utils/lgTvImport.ts'
import {
  variantGroupKeyForPlpCard,
  variantGroupKeyFromDetailUrl,
} from '../server/utils/lgListCardDomScrape.ts'

const args = process.argv.slice(2)
const quick = args.includes('--quick')
const onlySlugs = args.filter(a => !a.startsWith('--')).map(s => s.toLowerCase())
const limit = quick ? 30 : 500

function groupByKey(items, keyFn) {
  const map = new Map()
  for (const item of items) {
    const key = keyFn(item)
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }
  return map
}

function normalizeName(name) {
  return String(name ?? '')
    .replace(/\s*รุ่น\s+[A-Z0-9-]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function auditCardGrouping(items) {
  const issues = []
  const plpCards = groupByKey(items, i => i.plp_card_key || `missing:${i.sku}`)
  const importGroups = groupByKey(items, i => i.variant_group_key || `sku:${i.sku}`)

  const plpCardCount = plpCards.size
  const importGroupCount = importGroups.size
  const skuCount = items.length

  if (plpCardCount !== importGroupCount) {
    issues.push({
      type: 'card-group-mismatch',
      message: `การ์ด PLP ${plpCardCount} แต่กลุ่ม import ${importGroupCount}`,
    })
  }

  for (const [plpKey, cardItems] of plpCards) {
    const groupKeys = new Set(cardItems.map(i => i.variant_group_key))
    if (groupKeys.size > 1) {
      issues.push({
        type: 'one-card-many-groups',
        plpKey,
        skus: cardItems.map(i => i.sku),
        groupKeys: [...groupKeys],
      })
    }
  }

  for (const [groupKey, members] of importGroups) {
    const plpKeys = new Set(members.map(i => i.plp_card_key).filter(Boolean))
    if (plpKeys.size > 1) {
      issues.push({
        type: 'one-group-many-cards',
        groupKey,
        plpKeys: [...plpKeys],
        skus: members.map(i => i.sku),
        names: members.map(i => i.name),
      })
    }

    if (members.length > 1) {
      const skus = members.map(m => m.sku)
      const uniqueSkus = new Set(skus)
      if (uniqueSkus.size !== skus.length) {
        issues.push({ type: 'duplicate-sku-in-group', groupKey, skus })
      }
    }
  }

  const nameToGroups = new Map()
  for (const item of items) {
    const norm = normalizeName(item.name)
    if (!norm) continue
    const set = nameToGroups.get(norm) ?? new Set()
    set.add(item.variant_group_key)
    nameToGroups.set(norm, set)
  }
  for (const [name, groupKeys] of nameToGroups) {
    if (groupKeys.size > 1) {
      const related = items.filter(i => normalizeName(i.name) === name)
      issues.push({
        type: 'similar-name-split-ok',
        name: name.slice(0, 80),
        groupCount: groupKeys.size,
        skus: related.map(i => i.sku),
      })
    }
  }

  return {
    plpCardCount,
    importGroupCount,
    skuCount,
    multiSkuGroups: [...importGroups.values()].filter(g => g.length > 1).length,
    issues,
  }
}

function runUnitTests() {
  const failures = []
  const cases = [
    {
      label: 'single washer card → model key',
      fn: () => variantGroupKeyForPlpCard(
        0,
        'https://www.lg.com/th/laundry/front-load-washing-machine/fv1413h4m/lgsubscribe',
        'https://www.lg.com/th/laundry/front-load-washing-machine/fv1413h4m/lgsubscribe',
        'plp-card:p0:c0',
      ),
      expect: 'th/laundry/front-load-washing-machine/fv1413h4m',
    },
    {
      label: 'multi swatch TV → family key',
      fn: () => variantGroupKeyForPlpCard(
        3,
        'https://www.lg.com/th/tv-soundbars/oled-evo/oled65c6psa/lgsubscribe',
        'https://www.lg.com/th/tv-soundbars/oled-evo/oled65c6psa/lgsubscribe',
        'plp-card:p0:c1',
      ),
      expect: 'th/tv-soundbars/oled-evo',
    },
    {
      label: 'different model keys must differ',
      fn: () => {
        const a = variantGroupKeyFromDetailUrl(
          'https://www.lg.com/th/laundry/front-load-washing-machine/fv1413h4m/lgsubscribe',
          'model',
        )
        const b = variantGroupKeyFromDetailUrl(
          'https://www.lg.com/th/laundry/front-load-washing-machine/f2520rntb/lgsubscribe',
          'model',
        )
        return a !== b && a.includes('fv1413') && b.includes('f2520')
      },
      expect: true,
    },
  ]
  for (const c of cases) {
    const got = c.fn()
    if (got !== c.expect) failures.push({ label: c.label, expect: c.expect, got })
  }
  return failures
}

const sources = getImportableLgSubscriptionSources().filter(
  s => !onlySlugs.length || onlySlugs.includes(s.lgSlug),
)

if (!sources.length) {
  console.error('ไม่พบหมวด — ใช้ lgSlug เช่น washers, tvs')
  process.exit(1)
}

const unitFailures = runUnitTests()
console.log('='.repeat(72))
console.log(`LG import card-group test — ${sources.length} หมวด, limit=${limit}`)
console.log('='.repeat(72))
console.log(unitFailures.length ? `[unit] FAIL ${unitFailures.length}` : '[unit] OK')

const started = Date.now()
const results = []

for (let i = 0; i < sources.length; i += 1) {
  const source = sources[i]
  console.log(`\n[${i + 1}/${sources.length}] ${source.lgSlug} (${source.label})`)
  const row = {
    lgSlug: source.lgSlug,
    label: source.label,
    status: 'ERROR',
    plpCardCount: 0,
    importGroupCount: 0,
    skuCount: 0,
    multiSkuGroups: 0,
    issues: [],
    cards: [],
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

    const items = cards.map(c => ({
      sku: (c.model_key || '').toUpperCase(),
      name: c.name,
      variant_group_key: c.variant_group_key ?? null,
      plp_card_key: c.plp_card_key ?? null,
      variant_label: c.variant_label ?? null,
      source_url: c.source_url,
    })).filter(i => i.sku)

    const audit = auditCardGrouping(items)
    const plpCards = groupByKey(items, i => i.plp_card_key || `missing:${i.sku}`)
    row.plpCardCount = audit.plpCardCount
    row.importGroupCount = audit.importGroupCount
    row.skuCount = audit.skuCount
    row.multiSkuGroups = audit.multiSkuGroups
    row.issues = audit.issues.filter(i => i.type !== 'similar-name-split-ok')
    row.cards = [...plpCards.entries()].map(([plpKey, members]) => ({
      plpKey,
      groupKey: members[0]?.variant_group_key,
      skus: members.map(m => m.sku),
      names: members.map(m => m.name?.slice(0, 60)),
    }))

    const hardFails = row.issues.filter(i =>
      i.type === 'card-group-mismatch'
      || i.type === 'one-card-many-groups'
      || i.type === 'one-group-many-cards',
    )
    row.status = hardFails.length ? 'FAIL' : row.issues.length ? 'WARN' : 'OK'
    row.ms = Date.now() - t0

    console.log(
      `  → ${row.status} cards=${row.plpCardCount} groups=${row.importGroupCount}`
      + ` skus=${row.skuCount} multi=${row.multiSkuGroups} · ${(row.ms / 1000).toFixed(1)}s`,
    )
    for (const issue of hardFails.slice(0, 3)) {
      console.log(`     ✗ ${issue.type}: ${issue.message || JSON.stringify(issue).slice(0, 100)}`)
    }
  }
  catch (err) {
    row.error = err instanceof Error ? err.message : String(err)
    row.ms = Date.now() - t0
    console.log(`  → ERROR ${row.error}`)
  }
  results.push(row)
}

const elapsed = Math.round((Date.now() - started) / 1000)
const fail = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length
const empty = results.filter(r => r.status === 'EMPTY').length
const ok = results.filter(r => r.status === 'OK').length

console.log('\n' + '='.repeat(72))
console.log('SUMMARY', { unitFail: unitFailures.length, ok, fail, empty, elapsedSec: elapsed })
console.log('lgSlug'.padEnd(22), 'cards', 'groups', 'skus', 'status')
for (const r of results) {
  console.log(
    r.lgSlug.padEnd(22),
    String(r.plpCardCount).padEnd(6),
    String(r.importGroupCount).padEnd(7),
    String(r.skuCount).padEnd(5),
    r.status,
  )
}

const report = { startedAt: new Date(started).toISOString(), elapsedSec: elapsed, unitFailures, results }
try {
  mkdirSync('tmp', { recursive: true })
  writeFileSync('tmp/lg-import-card-groups.json', JSON.stringify(report, null, 2))
  console.log('\nReport: tmp/lg-import-card-groups.json')
}
catch { /* ignore */ }

process.exit(unitFailures.length || fail || empty ? 1 : 0)
