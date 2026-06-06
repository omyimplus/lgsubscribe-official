/**
 * Tester เฉพาะหมวด เครื่องซักผ้า (washers) — PLP + PDP
 *
 *   npx tsx scripts/test-washers-import.mjs              # เร็ว: PLP 3 SKU + PDP 1 รายการ
 *   npx tsx scripts/test-washers-import.mjs --limit 1    # PLP 1 SKU เท่านั้น
 *   npx tsx scripts/test-washers-import.mjs --plp-only   # ไม่เปิด PDP
 *   npx tsx scripts/test-washers-import.mjs --full       # จำลอง admin catalog (limit 500)
 *   npx tsx scripts/test-washers-import.mjs --pdp SKU URL  # ทด PDP ตรงๆ
 *
 * ต้องมี Chrome/Chromium สำหรับ Playwright
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { getLgSubscriptionSource, lgSubscriptionListPath } from '../server/utils/lgSubscriptionSources.ts'
import {
  collectTvListCardsWithBrowser,
  parseTvDetail,
} from '../server/utils/lgTvImport.ts'

const SOURCE = getLgSubscriptionSource('washers')
if (!SOURCE?.categorySlug) {
  console.error('ไม่พบ source washers ใน lgSubscriptionSources')
  process.exit(1)
}

const args = process.argv.slice(2)
const plpOnly = args.includes('--plp-only')
const fullCatalog = args.includes('--full')
const limitArg = args.find((a, i) => a === '--limit' && args[i + 1])
const limitIdx = args.indexOf('--limit')
const limit = fullCatalog
  ? 500
  : limitIdx >= 0
    ? Math.max(1, Number.parseInt(args[limitIdx + 1] ?? '3', 10) || 3)
    : 3
const pdpIdx = args.indexOf('--pdp')
const pdpOnly = pdpIdx >= 0
const pdpSku = pdpOnly ? args[pdpIdx + 1] : null
const pdpUrl = pdpOnly ? args[pdpIdx + 2] : null

function ms(start) {
  return Date.now() - start
}

function fmtSec(msVal) {
  return `${(msVal / 1000).toFixed(1)}s`
}

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

async function runPdpTest(sku, url) {
  console.log(`\n[PDP only] ${sku} → ${url}`)
  const t0 = Date.now()
  try {
    const parsed = await parseTvDetail(url)
    const missing = auditPdp(parsed)
    const status = missing.some(m => m.startsWith('pdp:images')) ? 'FAIL' : missing.length ? 'WARN' : 'OK'
    console.log(`  → ${status} images=${parsed.image_urls?.length ?? 0} ${fmtSec(ms(t0))}`)
    if (missing.length) console.log(`     missing: ${missing.join(', ')}`)
    return { phase: 'pdp', sku, url, status, missing, ms: ms(t0), parsed: { name: parsed.name, sku: parsed.sku, images: parsed.image_urls?.length ?? 0 } }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log(`  → ERROR ${message}`)
    return { phase: 'pdp', sku, url, status: 'ERROR', error: message, ms: ms(t0) }
  }
}

async function main() {
  const started = Date.now()
  const report = {
    source: {
      lgSlug: SOURCE.lgSlug,
      label: SOURCE.label,
      categorySlug: SOURCE.categorySlug,
      listUrl: SOURCE.listUrl,
    },
    options: { limit, plpOnly, fullCatalog, pdpOnly },
    phases: [],
    cards: [],
    status: 'OK',
    error: null,
    elapsedMs: 0,
  }

  console.log('='.repeat(72))
  console.log('Washers import tester')
  console.log(`  list: ${SOURCE.listUrl}`)
  console.log(`  limit: ${limit}${fullCatalog ? ' (full catalog mode)' : ''}`)
  console.log('='.repeat(72))

  if (pdpOnly) {
    if (!pdpSku || !pdpUrl) {
      console.error('Usage: --pdp SKU DETAIL_URL')
      process.exit(1)
    }
    report.phases.push(await runPdpTest(pdpSku, pdpUrl))
    report.elapsedMs = ms(started)
    saveReport(report)
    process.exit(report.phases.some(p => p.status === 'ERROR' || p.status === 'FAIL') ? 1 : 0)
  }

  console.log('\n[1/2] PLP scrape (Playwright)…')
  const plpStart = Date.now()
  try {
    const cards = await collectTvListCardsWithBrowser(limit, SOURCE.listUrl, {
      lgSlug: SOURCE.lgSlug,
      listPath: lgSubscriptionListPath(SOURCE.lgSlug),
      allowEmpty: true,
    })
    const plpMs = ms(plpStart)
    console.log(`  ✓ ${cards.length} card(s) in ${fmtSec(plpMs)}`)
    report.phases.push({ phase: 'plp', status: cards.length ? 'OK' : 'EMPTY', count: cards.length, ms: plpMs })

    for (const card of cards) {
      const missing = auditCard(card)
      report.cards.push({
        sku: card.model_key,
        name: card.name,
        detailUrl: card.source_url,
        base_price: card.base_price,
        variant_label: card.variant_label ?? null,
        missing,
        status: missing.some(m => m.includes('detail')) ? 'FAIL' : missing.length ? 'WARN' : 'OK',
      })
      console.log(
        `    • ${card.model_key} ฿${card.base_price ?? '-'}/mo  ${card.source_url?.slice(0, 60)}…`,
      )
    }

    if (!cards.length) {
      report.status = 'EMPTY'
      report.error = 'ไม่พบสินค้าบนหน้า LG washers'
      saveReport(report)
      process.exit(1)
    }

    if (plpOnly) {
      report.elapsedMs = ms(started)
      saveReport(report)
      console.log(`\nDone (PLP only) ${fmtSec(report.elapsedMs)}`)
      process.exit(0)
    }

    console.log('\n[2/2] PDP parse (sample)…')
    const sample = cards.slice(0, Math.min(3, cards.length))
    for (const card of sample) {
      const row = await runPdpTest(card.model_key, card.source_url)
      report.phases.push(row)
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    report.status = 'ERROR'
    report.error = message
    report.phases.push({ phase: 'plp', status: 'ERROR', error: message, ms: ms(plpStart) })
    console.error(`\n✗ ERROR: ${message}`)
    if (/timeout/i.test(message)) {
      console.error('\nTips:')
      console.error('  • ลอง --limit 1 หรือ --plp-only ก่อน')
      console.error('  • ถ้า admin timeout ให้รอ scrape จบ (full catalog ~3–10 นาที)')
      console.error('  • ดู log [lg-import] ใน terminal dev server')
    }
    report.elapsedMs = ms(started)
    saveReport(report)
    process.exit(1)
  }

  report.elapsedMs = ms(started)
  const fails = report.phases.filter(p => p.status === 'ERROR' || p.status === 'FAIL').length
  const warns = report.phases.filter(p => p.status === 'WARN').length
  report.status = fails ? 'FAIL' : warns ? 'WARN' : 'OK'

  console.log('\n' + '='.repeat(72))
  console.log(`SUMMARY ${report.status} — ${fmtSec(report.elapsedMs)} (PLP limit=${limit})`)
  console.log('='.repeat(72))

  saveReport(report)
  process.exit(fails ? 1 : 0)
}

function saveReport(report) {
  try {
    mkdirSync('tmp', { recursive: true })
    const path = 'tmp/washers-import-test.json'
    writeFileSync(path, JSON.stringify(report, null, 2))
    console.log(`\nReport: ${path}`)
  }
  catch {
    // ignore
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
