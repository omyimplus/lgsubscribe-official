/**
 * Seed categories via API (ใช้ service role ผ่าน server)
 * รัน: node scripts/seed-categories.mjs
 * ต้องมี dev server รันอยู่ที่ localhost:3000 หรือตั้ง BASE_URL
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const categories = [
  { name: 'เครื่องซักผ้า', slug: 'washing-machine', sort_order: 1 },
  { name: 'เครื่องอบผ้า', slug: 'dryer', sort_order: 2 },
  { name: 'เครื่องกรองน้ำ', slug: 'water-purifier', sort_order: 3 },
  { name: 'ตู้เย็น', slug: 'refrigerator', sort_order: 4 },
  { name: 'ตู้แช่แข็ง', slug: 'freezer', sort_order: 5 },
  { name: 'ทีวี', slug: 'tv', sort_order: 6 },
  { name: 'มอนิเตอร์', slug: 'monitor', sort_order: 7 },
  { name: 'ตู้ถนอมผ้า', slug: 'styler', sort_order: 8 },
  { name: 'เครื่องฟอกอากาศ', slug: 'air-purifier', sort_order: 9 },
  { name: 'เครื่องล้างจาน', slug: 'dishwasher', sort_order: 10 },
  { name: 'เครื่องปรับอากาศ', slug: 'air-conditioner', sort_order: 11 },
  { name: 'เครื่องดูดฝุ่น', slug: 'vacuum-cleaner', sort_order: 12 },
  { name: 'เครื่องลดความชื้น', slug: 'dehumidifier', sort_order: 13 },
  { name: 'ลำโพงพกพา', slug: 'portable-speaker', sort_order: 14 },
  { name: 'ซาวด์บาร์', slug: 'soundbar', sort_order: 15 },
  { name: 'ไมโครเวฟ', slug: 'microwave', sort_order: 16 },
]

async function main() {
  console.log(`Seeding ${categories.length} categories → ${BASE_URL}/api/categories\n`)

  for (const cat of categories) {
    const res = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cat, is_active: true }),
    })

    if (res.ok) {
      console.log(`✓ ${cat.name}`)
      continue
    }

    const err = await res.json().catch(() => ({}))
    if (err?.message?.includes('duplicate') || err?.message?.includes('unique')) {
      const patch = await fetch(`${BASE_URL}/api/categories`, { method: 'GET' })
      const list = await patch.json()
      const existing = list.find((c) => c.slug === cat.slug)
      if (existing) {
        await fetch(`${BASE_URL}/api/categories/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...cat, is_active: true }),
        })
        console.log(`↻ ${cat.name} (updated)`)
        continue
      }
    }
    console.error(`✗ ${cat.name}:`, err?.message || res.status)
  }

  const list = await fetch(`${BASE_URL}/api/categories`).then(r => r.json())
  console.log(`\nDone — ${list.length} categories in database`)
}

main().catch(console.error)
