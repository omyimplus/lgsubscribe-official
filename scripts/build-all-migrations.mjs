#!/usr/bin/env node
/**
 * รวม supabase/migrations/*.sql → supabase/ALL_MIGRATIONS.sql
 * รัน: node scripts/build-all-migrations.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const migrationsDir = join(root, 'supabase', 'migrations')
const outPath = join(root, 'supabase', 'ALL_MIGRATIONS.sql')

const files = (await readdir(migrationsDir))
  .filter(f => f.endsWith('.sql'))
  .sort()

const versions = files.map(f => f.split('_')[0])
const dupes = [...new Set(versions.filter((v, i) => versions.indexOf(v) !== i))]
if (dupes.length) {
  console.error(`Duplicate migration version prefix(es): ${dupes.join(', ')}`)
  console.error('Rename files so each starts with a unique number (e.g. 0035_name.sql).')
  process.exit(1)
}

const lastVer = files.length ? files[files.length - 1].split('_')[0] : '????'
const header = `-- =============================================================================
-- LG Subscribe — รวม migrations ทั้งโปรเจกต์ (รันบน Supabase ว่าง)
-- =============================================================================
-- วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
-- หรือ: psql "$DATABASE_URL" -f supabase/ALL_MIGRATIONS.sql
--
-- คำเตือน:
--   • ใช้กับโปรเจกต์ Supabase ใหม่ / ยังไม่มี schema นี้
--   • ถ้ามีตารางเดิมแล้ว บางคำสั่งอาจ error (duplicate) — อย่ารันซ้ำทั้งไฟล์
--   • ลำดับตามไฟล์ 0001 → ${lastVer} (${files.length} ไฟล์)
--   • Regenerate: node scripts/build-all-migrations.mjs
-- =============================================================================
`

const parts = [header]
for (const file of files) {
  const sql = await readFile(join(migrationsDir, file), 'utf8')
  parts.push(
    '',
    '-- -----------------------------------------------------------------------------',
    `-- ${file}`,
    '-- -----------------------------------------------------------------------------',
    '',
    sql.trimEnd(),
    '',
  )
}

await writeFile(outPath, `${parts.join('\n')}\n`)
console.log(`Wrote ${outPath} (${files.length} migrations)`)
