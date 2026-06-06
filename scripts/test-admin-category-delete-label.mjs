/**
 * Unit test logic ปุ่ม "ลบในหมวด" — ไม่ต้องเปิด browser
 * node scripts/test-admin-category-delete-label.mjs
 */

function productsInSelectedCategory(products, filterCategory) {
  if (!filterCategory) return []
  return products.filter(
    p => p.category_id === filterCategory || p.category?.id === filterCategory,
  )
}

function buttonLabel(filterCategory, count, clearing = false) {
  if (clearing) return 'กำลังลบ...'
  if (!filterCategory) return 'ลบในหมวด'
  return `ลบในหมวด (${count})`
}

const catA = 'cat-washer-id'
const products = [
  { id: '1', category_id: catA, category: { id: catA, name: 'เครื่องซักผ้า' } },
  { id: '2', category_id: catA, category: { id: catA, name: 'เครื่องซักผ้า' } },
  { id: '3', category_id: 'other', category: { id: 'other', name: 'ทีวี' } },
  { id: '4', category_id: undefined, category: { id: catA, name: 'เครื่องซักผ้า' } },
]

const inCat = productsInSelectedCategory(products, catA)
const label = buttonLabel(catA, inCat.length)

const failures = []
if (inCat.length !== 3) failures.push(`expected 3 in category, got ${inCat.length}`)
if (label !== 'ลบในหมวด (3)') failures.push(`expected label with (3), got "${label}"`)
if (String(label).includes('undefined')) failures.push('label contains undefined')
if (buttonLabel('', 0) !== 'ลบในหมวด') failures.push('empty filter should show plain label')

if (failures.length) {
  console.error('FAIL:', failures.join('\n'))
  process.exit(1)
}

console.log('PASS admin category delete label logic')
console.log(`  inCat=${inCat.length} label="${label}"`)
