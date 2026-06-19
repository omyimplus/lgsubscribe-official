/**
 * เทสความตรงของชื่อ/ข้อมูล scrape vs LG API + ชื่อหลัง import
 *
 *   npx tsx scripts/test-lg-data-fidelity.mjs
 *   npx tsx scripts/test-lg-data-fidelity.mjs tvs air-conditioners washers
 *
 * รายงาน: tmp/lg-data-fidelity.json
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { collectTvListCardsWithBrowser } from '../server/utils/lgTvImport.ts'
import {
  buildVariantCardName,
  getLgSubscriptionSource,
  lgSubscriptionListPath,
} from '../server/utils/lgSubscriptionSources.ts'

const DEFAULT_SLUGS = ['tvs', 'air-conditioners', 'washers']
const slugs = process.argv.slice(2).map(s => s.toLowerCase()).filter(Boolean)
const targets = slugs.length ? slugs : DEFAULT_SLUGS

function importDisplayName(parsedName, listCard, sku) {
  if (listCard.name?.trim()) {
    return buildVariantCardName(listCard.name, null, sku)
  }
  return buildVariantCardName(parsedName, listCard.variant_label, sku)
}

function normalizeBtu(text) {
  const m = String(text ?? '').match(/(\d[\d,]*)\s*BTU/i)
  return m ? Number.parseInt(m[1].replace(/,/g, ''), 10) : null
}

function normalizeInch(text, label) {
  const fromName = String(text ?? '').match(/ทีวี\s*(\d+)\s*"/i)?.[1]
  if (fromName) return Number.parseInt(fromName, 10)
  const fromLabel = String(label ?? '').match(/(\d+)/)?.[1]
  return fromLabel ? Number.parseInt(fromLabel, 10) : null
}

function auditItem(item, source) {
  const issues = []
  const sku = item.sku.toUpperCase()
  const name = item.finalName || ''
  const importName = item.importName || ''

  if (!name) issues.push('missing-name')
  if (!item.base_price) issues.push('missing-price')
  if (!item.source_url?.includes('/lgsubscribe')) issues.push('bad-url')
  if (!name.toUpperCase().includes(sku)) issues.push('name-missing-sku')
  if (!importName.toUpperCase().includes(sku)) issues.push('import-name-missing-sku')

  if (source.variantAxis === 'btu') {
    const labelBtu = normalizeBtu(item.variant_label)
    const nameBtu = normalizeBtu(name)
    const importBtu = normalizeBtu(importName)
    // PLP label เป็น 9000/12000 BTU; ชื่อ LG มักเป็น 9,212 / 12,283 BTU — ยอมต่างได้ ~15%
    if (labelBtu && nameBtu && Math.abs(labelBtu - nameBtu) / labelBtu > 0.2) {
      issues.push(`btu-name-mismatch: label=${labelBtu} name=${nameBtu}`)
    }
    if (importBtu && nameBtu && importBtu !== nameBtu) {
      issues.push(`import-btu-changed: ${nameBtu} → ${importBtu}`)
    }
  }

  if (source.variantAxis === 'screen_inches') {
    const labelInch = normalizeInch(item.variant_label, item.variant_label)
    const nameInch = normalizeInch(name, item.variant_label)
    const importInch = normalizeInch(importName, item.variant_label)
    if (labelInch && nameInch && labelInch !== nameInch) {
      issues.push(`inch-label-name-mismatch: label=${labelInch} name=${nameInch}`)
    }
    if (importInch && nameInch && importInch !== nameInch) {
      issues.push(`import-inch-changed: ${nameInch} → ${importInch}`)
    }
  }

  return issues
}

const started = Date.now()
const results = []

console.log('='.repeat(72))
console.log(`LG data fidelity — ${targets.join(', ')}`)
console.log('='.repeat(72))

for (const lgSlug of targets) {
  const source = getLgSubscriptionSource(lgSlug)
  if (!source) {
    console.error(`ไม่รู้จักหมวด: ${lgSlug}`)
    process.exit(1)
  }

  console.log(`\n▶ ${source.label} (${lgSlug})`)
  const row = {
    lgSlug,
    label: source.label,
    status: 'ERROR',
    skuCount: 0,
    issueCount: 0,
    items: [],
    summary: {},
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

    const audited = []
    for (const card of cards) {
      const sku = (card.model_key || '').toUpperCase()
      const fakePdpName = card.name || sku
      const importName = importDisplayName(fakePdpName, card, sku)
      const item = {
        sku,
        variant_label: card.variant_label ?? null,
        finalName: card.name,
        importName,
        base_price: card.base_price,
        source_url: card.source_url,
        variant_group_key: card.variant_group_key,
        issues: [],
      }
      item.issues = auditItem(item, source)
      audited.push(item)
    }

    row.skuCount = audited.length
    row.issueCount = audited.reduce((n, i) => n + i.issues.length, 0)
    row.items = audited.map(i => ({
      sku: i.sku,
      variant_label: i.variant_label,
      finalName: i.finalName?.slice(0, 90),
      importName: i.importName?.slice(0, 90),
      base_price: i.base_price,
      issues: i.issues,
    }))

    const importNames = audited.map(i => i.importName)
    row.summary = {
      missingPrice: audited.filter(i => !i.base_price).length,
      duplicateImportNames: importNames.length - new Set(importNames).size,
      nameMissingSku: audited.filter(i => i.issues.some(x => x.includes('missing-sku'))).length,
      btuMismatches: audited.filter(i => i.issues.some(x => x.startsWith('btu-') || x.startsWith('import-btu') || x.startsWith('api-btu'))).length,
      inchMismatches: audited.filter(i => i.issues.some(x => x.startsWith('inch-') || x.startsWith('import-inch'))).length,
    }

    row.status = row.issueCount ? 'FAIL' : 'OK'
    row.ms = Date.now() - t0

    console.log(`  → ${row.status} ${row.skuCount} SKU, ${row.issueCount} issue(s) · ${(row.ms / 1000).toFixed(1)}s`)
    console.log(`     summary:`, row.summary)
    for (const i of audited.filter(x => x.issues.length)) {
      console.log(`     ✗ ${i.sku}: ${i.issues.join('; ')}`)
    }
    if (row.status === 'OK') {
      for (const i of audited.slice(0, 3)) {
        console.log(`     ✓ ${i.sku}  ${i.importName?.slice(0, 70)}…  ฿${i.base_price ?? '?'}/ด`)
      }
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
const ok = results.filter(r => r.status === 'OK').length
const fail = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length

console.log('\n' + '='.repeat(72))
console.log('SUMMARY', { ok, fail, elapsedSec: elapsed })

try {
  mkdirSync('tmp', { recursive: true })
  writeFileSync('tmp/lg-data-fidelity.json', JSON.stringify({ elapsedSec: elapsed, results }, null, 2))
  console.log('Report: tmp/lg-data-fidelity.json')
}
catch { /* ignore */ }

process.exit(fail ? 1 : 0)
