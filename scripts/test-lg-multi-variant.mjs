/**
 * เทสหมวดที่ 1 การ์ด = หลายขนาด (swatch) — นิ้ว / BTU / ขนาดจอ ฯลฯ
 * ตรวจว่า variant_label + ชื่อหลัง import ไม่ซ้ำกันต่อ SKU
 *
 *   npx tsx scripts/test-lg-multi-variant.mjs
 *   npx tsx scripts/test-lg-multi-variant.mjs tvs air-conditioners monitors
 *
 * รายงาน: tmp/lg-multi-variant-test.json
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { collectTvListCardsWithBrowser } from '../server/utils/lgTvImport.ts'
import {
  buildVariantCardName,
  getLgSubscriptionSource,
  lgSubscriptionListPath,
} from '../server/utils/lgSubscriptionSources.ts'

const DEFAULT_SLUGS = ['tvs', 'air-conditioners', 'monitors']
const args = process.argv.slice(2).map(s => s.toLowerCase())
const slugs = args.length ? args : DEFAULT_SLUGS

function importDisplayName(parsedName, listCard, sku) {
  if (listCard.name?.trim()) {
    return buildVariantCardName(listCard.name, null, sku)
  }
  return buildVariantCardName(parsedName, listCard.variant_label, sku)
}

function groupByKey(cards, keyFn) {
  const map = new Map()
  for (const c of cards) {
    const k = keyFn(c)
    const list = map.get(k) ?? []
    list.push(c)
    map.set(k, list)
  }
  return map
}

function sizeToken(name, label, axis) {
  if (axis === 'btu') {
    return name?.match(/(\d[\d,]*\s*BTU)/i)?.[1] || label?.match(/(\d[\d,]*\s*BTU)/i)?.[1] || null
  }
  if (axis === 'screen_inches') {
    return name?.match(/ทีวี\s*(\d+)\s*"/i)?.[1] || label?.match(/(\d+)/)?.[1] || null
  }
  return label?.match(/(\d+)/)?.[1] || name?.match(/(\d+)\s*(?:inch|นิ้ว|")/i)?.[1] || null
}

function auditMultiVariantGroup(members, axis, fakePdpName) {
  const issues = []
  const labels = members.map(m => m.variant_label).filter(Boolean)
  const uniqueLabels = new Set(labels)
  if (labels.length && uniqueLabels.size !== labels.length) {
    issues.push({ type: 'duplicate-variant-label', labels })
  }

  const importNames = members.map(m => importDisplayName(fakePdpName, m, m.model_key || ''))
  const uniqueNames = new Set(importNames)
  if (uniqueNames.size !== importNames.length) {
    issues.push({ type: 'duplicate-import-name', names: importNames })
  }

  const sizes = members.map((m, i) => sizeToken(importNames[i], m.variant_label, axis))
  const uniqueSizes = new Set(sizes.filter(Boolean))
  if (members.length > 1 && uniqueSizes.size < members.length) {
    issues.push({
      type: 'duplicate-size-token',
      axis,
      sizes: members.map((m, i) => ({
        sku: m.model_key,
        label: m.variant_label,
        importName: importNames[i],
        sizeToken: sizeToken(importNames[i], m.variant_label, axis),
      })),
    })
  }

  return {
    skus: members.map(m => m.model_key),
    labels,
    importNames,
    sizes: members.map((m, i) => ({
      sku: m.model_key,
      label: m.variant_label,
      importName: importNames[i],
      sizeToken: sizeToken(importNames[i], m.variant_label, axis),
    })),
    issues,
  }
}

const started = Date.now()
const results = []

console.log('='.repeat(72))
console.log(`Multi-variant import test — ${slugs.join(', ')}`)
console.log('='.repeat(72))

for (const lgSlug of slugs) {
  const source = getLgSubscriptionSource(lgSlug)
  if (!source) {
    console.error(`ไม่รู้จักหมวด: ${lgSlug}`)
    process.exit(1)
  }

  console.log(`\n▶ ${source.label} (${lgSlug}) axis=${source.variantAxis}`)
  const row = {
    lgSlug,
    label: source.label,
    variantAxis: source.variantAxis,
    status: 'ERROR',
    multiGroups: [],
    error: null,
    ms: 0,
  }
  const t0 = Date.now()

  try {
    const cards = await collectTvListCardsWithBrowser(500, source.listUrl, {
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

    const groups = groupByKey(cards, c => c.variant_group_key || c.plp_card_key || `sku:${c.model_key}`)
    const multi = [...groups.entries()].filter(([, m]) => m.length > 1)

    if (!multi.length) {
      row.status = 'SKIP'
      row.error = 'ไม่มีการ์ดหลายขนาดบน PLP ตอนนี้'
      row.ms = Date.now() - t0
      results.push(row)
      console.log('  → SKIP (no multi-variant card)')
      continue
    }

    let failCount = 0
    for (const [groupKey, members] of multi) {
      const fakePdpName = members[0]?.name || `${members[0]?.model_key}`
      const audit = auditMultiVariantGroup(members, source.variantAxis, fakePdpName)
      row.multiGroups.push({ groupKey, ...audit })
      if (audit.issues.length) failCount += 1
      console.log(`  กลุ่ม ${groupKey.slice(0, 50)}`)
      for (const s of audit.sizes) {
        console.log(`    ${s.sku}  label=${s.label ?? '-'}  size=${s.sizeToken ?? '?'}  ${s.importName?.slice(0, 55)}…`)
      }
      if (audit.issues.length) {
        console.log(`    ✗ ${audit.issues.map(i => i.type).join(', ')}`)
      }
    }

    row.status = failCount ? 'FAIL' : 'OK'
    row.ms = Date.now() - t0
    console.log(`  → ${row.status} (${multi.length} กลุ่มหลายขนาด, ${failCount} ปัญหา) · ${(row.ms / 1000).toFixed(1)}s`)
  }
  catch (err) {
    row.error = err instanceof Error ? err.message : String(err)
    row.ms = Date.now() - t0
    console.log(`  → ERROR ${row.error}`)
  }

  results.push(row)
}

const elapsed = Math.round((Date.now() - started) / 1000)
const ok = results.filter(r => r.status === 'OK').length
const fail = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length

console.log('\n' + '='.repeat(72))
console.log('SUMMARY', { ok, fail, skip: results.filter(r => r.status === 'SKIP').length, elapsedSec: elapsed })

try {
  mkdirSync('tmp', { recursive: true })
  writeFileSync('tmp/lg-multi-variant-test.json', JSON.stringify({ elapsedSec: elapsed, results }, null, 2))
  console.log('Report: tmp/lg-multi-variant-test.json')
}
catch { /* ignore */ }

process.exit(fail ? 1 : 0)
