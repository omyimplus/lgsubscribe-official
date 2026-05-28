/**
 * Seed main + sub categories ตามเมนู lg.com
 * รัน: node scripts/seed-lg-menu.mjs
 * ต้องมี .env และ migration 0004 รันแล้ว
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

function loadEnv() {
  const path = resolve(process.cwd(), '.env')
  const text = readFileSync(path, 'utf8')
  const env = {}
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return env
}

const env = loadEnv()
const supabase = createClient(
  env.NUXT_PUBLIC_SUPABASE_URL,
  env.NUXT_SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: ws } },
)

const menu = [
  {
    main: { name: 'ทีวี & Soundbars', slug: 'tv-soundbars', sort_order: 1 },
    subs: [
      { name: 'โทรทัศน์', slug: 'television', sort_order: 1 },
      { name: 'ลำโพง Soundbars', slug: 'soundbar', sort_order: 2 },
    ],
  },
  {
    main: { name: 'เครื่องใช้ไฟฟ้าภายในบ้าน', slug: 'home-appliances', sort_order: 2 },
    subs: [
      { name: 'เครื่องซักผ้า', slug: 'washing-machine', sort_order: 1 },
      { name: 'เครื่องอบผ้า', slug: 'dryer', sort_order: 2 },
      { name: 'ตู้ถนอมผ้า', slug: 'styler', sort_order: 3 },
      { name: 'ตู้เย็น', slug: 'refrigerator', sort_order: 4 },
      { name: 'เครื่องดูดฝุ่น', slug: 'vacuum-cleaner', sort_order: 5 },
      { name: 'เตาอบไมโครเวฟ', slug: 'microwave-oven', sort_order: 6 },
      { name: 'เครื่องล้างจาน', slug: 'dishwasher', sort_order: 7 },
      { name: 'เครื่องกรองน้ำ', slug: 'water-purifier', sort_order: 8 },
    ],
  },
  {
    main: { name: 'ระบบปรับอากาศ', slug: 'air-conditioning', sort_order: 3 },
    subs: [
      { name: 'เครื่องปรับอากาศ', slug: 'air-conditioner', sort_order: 1 },
      { name: 'เครื่องฟอกอากาศ', slug: 'air-purifier', sort_order: 2 },
      { name: 'เครื่องลดความชื้น', slug: 'dehumidifier', sort_order: 3 },
    ],
  },
  {
    main: { name: 'จอมอนิเตอร์', slug: 'monitors', sort_order: 4 },
    subs: [
      { name: 'จอมอนิเตอร์', slug: 'monitor', sort_order: 1 },
    ],
  },
]

async function main() {
  console.log('Seeding LG.com menu structure...\n')

  const { error: delErr } = await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) console.warn('Clear categories:', delErr.message)

  for (const group of menu) {
    const { data: main, error: mainErr } = await supabase
      .from('main_categories')
      .upsert({ ...group.main, is_active: true }, { onConflict: 'slug' })
      .select()
      .single()

    if (mainErr) {
      console.error('Main:', group.main.name, mainErr.message)
      continue
    }
    console.log(`▸ ${main.name}`)

    for (const sub of group.subs) {
      const { error: subErr } = await supabase
        .from('categories')
        .upsert({
          ...sub,
          main_category_id: main.id,
          is_active: true,
        }, { onConflict: 'slug' })
      console.log(subErr ? `  ✗ ${sub.name}: ${subErr.message}` : `  ✓ ${sub.name}`)
    }
  }

  const { count } = await supabase.from('categories').select('*', { count: 'exact', head: true })
  console.log(`\nDone — ${count} sub-categories`)
}

main().catch(console.error)
