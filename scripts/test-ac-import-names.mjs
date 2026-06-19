/**
 * Unit test ชื่อแอร์ตอน import — BTU ต้องไม่ซ้ำกันต่อ SKU
 * npx tsx scripts/test-ac-import-names.mjs
 */
import { buildVariantCardName } from '../server/utils/lgSubscriptionSources.ts'

function importDisplayName(parsedName, listCard, sku) {
  return buildVariantCardName(listCard.name || parsedName, listCard.variant_label, sku)
}

const pdpName = 'แอร์อินเวอร์เตอร์ 18,084 BTU LG DUALCOOL AI Air รุ่น SIQ18B'
const group = [
  { sku: 'SIQ18B', label: '18000 BTU', plpName: 'แอร์อินเวอร์เตอร์ 18,084 BTU LG DUALCOOL AI Air รุ่น SIQ18B' },
  { sku: 'SIQ24B', label: '24000 BTU', plpName: 'แอร์อินเวอร์เตอร์ 22,178 BTU LG DUALCOOL AI Air รุ่น SIQ24B' },
  { sku: 'SIQ13B', label: '12000 BTU', plpName: 'แอร์อินเวอร์เตอร์ 12,283 BTU LG DUALCOOL AI Air รุ่น SIQ13B' },
  { sku: 'SIQ11B', label: '9000 BTU', plpName: 'แอร์อินเวอร์เตอร์ 9,212 BTU LG DUALCOOL AI Air รุ่น SIQ11B' },
]

const failures = []

console.log('=== OLD (PDP name only, no BTU fix) ===')
for (const row of group) {
  const old = buildVariantCardName(pdpName, null, row.sku)
  console.log(`${row.sku}\t${old.match(/\d[\d,]*\s*BTU/i)?.[0] ?? '?'}\t${old.slice(0, 70)}`)
}

console.log('\n=== NEW (listCard.name, SKU only) ===')
const names = new Set()
for (const row of group) {
  const card = { name: row.plpName, variant_label: row.label }
  const name = card.name?.trim()
    ? buildVariantCardName(card.name, null, row.sku)
    : importDisplayName(pdpName, card, row.sku)
  const btu = name.match(/\d[\d,]*\s*BTU/i)?.[0] ?? '?'
  console.log(`${row.sku}\t${row.label}\t${btu}\t${name.slice(0, 70)}`)
  names.add(name)
  if (!name.includes(row.sku)) failures.push(`${row.sku}: missing sku in name`)
}

const btuSet = new Set(group.map(r => {
  const card = { name: r.plpName, variant_label: r.label }
  return buildVariantCardName(card.name, null, r.sku).match(/\d[\d,]*\s*BTU/i)?.[0]
}))
if (btuSet.size !== group.length) {
  failures.push(`BTU not unique: ${[...btuSet].join(', ')}`)
}

if (failures.length) {
  console.error('\nFAIL:', failures.join('\n'))
  process.exit(1)
}
console.log('\nPASS — each SKU has distinct BTU in import name')
