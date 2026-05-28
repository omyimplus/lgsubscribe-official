/**
 * Seed tags ตาม PROJECT_SPEC
 * รัน: node scripts/seed-tags.mjs
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

function loadEnv() {
  const text = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
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

const tags = [
  { name: 'ลดราคา', slug: 'sale', color: '#dc2626', sort_order: 1 },
  { name: 'มาแรง', slug: 'hot', color: '#ea580c', sort_order: 2 },
  { name: 'น่าสนใจ', slug: 'featured', color: '#2563eb', sort_order: 3 },
  { name: 'มาใหม่! น่าสนใจ', slug: 'new-featured', color: '#7c3aed', sort_order: 4 },
]

async function main() {
  for (const tag of tags) {
    const { error } = await supabase
      .from('tags')
      .upsert({ ...tag, is_active: true }, { onConflict: 'slug' })
    console.log(error ? `✗ ${tag.name}: ${error.message}` : `✓ ${tag.name}`)
  }
  const { count } = await supabase.from('tags').select('*', { count: 'exact', head: true })
  console.log(`\nDone — ${count} tags`)
}

main().catch(console.error)
