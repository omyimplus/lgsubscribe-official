/**
 * ทดสอบฟีเจอร์ใหม่: ลูกค้าองค์กร, LP careers, inquiry_source
 *
 * Unit (ไม่ต้องมี server/DB):
 *   npx tsx scripts/test-new-storefront-features.mjs
 *
 * รวม HTTP + บันทึก DB จริง (ต้องรัน migration + dev server):
 *   npx tsx scripts/test-new-storefront-features.mjs --live
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = resolve(import.meta.dirname, '..')
const LIVE = process.argv.includes('--live')
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

const failures = []
const passes = []

function pass(name, detail = '') {
  passes.push(name)
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail) {
  failures.push(`${name}: ${detail}`)
  console.error(`  ✗ ${name} — ${detail}`)
}

function assert(name, condition, detail = 'assertion failed') {
  if (condition) pass(name)
  else fail(name, detail)
}

async function importShared(relPath) {
  const url = pathToFileURL(resolve(ROOT, relPath)).href
  return import(url)
}

function validCorporateInquiry(overrides = {}) {
  return {
    applicant_type: 'corporate',
    inquiry_source: 'corporate',
    first_name: 'สมชาย',
    last_name: 'ใจดี',
    contact_phone: '0812345678',
    address_line: '123 ถนนสุขุมวิท',
    subdistrict: 'คลองตัน',
    district: 'วัฒนา',
    province: 'กรุงเทพมหานคร',
    postal_code: '10110',
    company_name: 'บริษัท ทดสอบ จำกัด',
    company_registration: '0123456789012',
    director_first_name: 'วิชัย',
    director_last_name: 'มั่นคง',
    preferred_contact_time: '14:00 – 17:00 น.',
    security_code: 'Ab3xy',
    security_code_expected: 'Ab3xy',
    items: [],
    ...overrides,
  }
}

function validLpInput(overrides = {}) {
  return {
    first_name: 'สมหญิง',
    last_name: 'รักงาน',
    contact_phone: '0898765432',
    email: 'lp.test@example.com',
    line_id: '@lp_tester',
    province: 'เชียงใหม่',
    preferred_contact_time: 'จันทร์–ศุกร์ 09:00–17:00 น.',
    sales_experience: 'yes',
    work_mode: 'online',
    employment_type: 'part_time',
    lg_subscribe_awareness: 'know',
    motivation: 'ชอบงานขายและเชื่อมั่นในแบรนด์ LG',
    expected_income: '30001_50000',
    security_code: 'Xy9zQ',
    security_code_expected: 'Xy9zQ',
    ...overrides,
  }
}

// ─── Unit: LP form ───────────────────────────────────────────────
async function testLpForm() {
  console.log('\n[LP] validateLpApplicationForm')
  const { validateLpApplicationForm } = await importShared('shared/utils/lpApplicationForm.ts')

  const ok = validateLpApplicationForm(validLpInput())
  assert('LP form accepts valid payload', ok.ok === true)
  if (ok.ok) {
    assert('LP questionnaire sales_experience', ok.data.questionnaire.sales_experience === 'yes')
    assert('LP normalizes phone digits', ok.data.contact_phone === '0898765432')
  }

  const badCaptcha = validateLpApplicationForm(validLpInput({ security_code: 'wrong' }))
  assert('LP form rejects bad captcha', badCaptcha.ok === false)

  const badEmail = validateLpApplicationForm(validLpInput({ email: 'not-an-email' }))
  assert('LP form rejects bad email', badEmail.ok === false)

  const missingQ = validateLpApplicationForm(validLpInput({ expected_income: '' }))
  assert('LP form rejects missing income', missingQ.ok === false)
}

// ─── Unit: corporate inquiry validation ────────────────────────
async function testCorporateInquiryValidation() {
  console.log('\n[Corporate] validateInquiryContactForm')
  const { validateInquiryContactForm, formatContactDisplayName } = await importShared('shared/utils/inquiryForm.ts')

  const payload = validCorporateInquiry()
  const result = validateInquiryContactForm(payload)
  assert('Corporate contact form validates', result.ok === true)
  if (result.ok) {
    assert('Corporate profile has company', Boolean(result.profile.company_name))
    assert('Corporate display name includes company', formatContactDisplayName(result.profile).includes('บริษัท'))
    assert('Director names stored', result.profile.director_first_name === 'วิชัย')
  }

  const badReg = validateInquiryContactForm(validCorporateInquiry({ company_registration: '123' }))
  assert('Corporate rejects invalid company reg', badReg.ok === false)
}

// ─── Unit: summaries & labels ──────────────────────────────────
async function testSummariesAndLabels() {
  console.log('\n[Shared] line summaries & labels')
  const { buildLineSummary } = await importShared('shared/utils/inquiryLineSummary.ts')
  const { buildLpApplicationLineSummary } = await importShared('shared/utils/lpApplicationLineSummary.ts')
  const { inquirySourceLabel } = await importShared('shared/utils/inquirySource.ts')
  const { validateInquiryContactForm } = await importShared('shared/utils/inquiryForm.ts')

  assert('inquirySourceLabel corporate', inquirySourceLabel('corporate') === 'ลูกค้าองค์กร')
  assert('inquirySourceLabel default cart', inquirySourceLabel('product_cart') === 'สนใจสินค้า (ตะกร้า)')

  const corp = validateInquiryContactForm(validCorporateInquiry())
  if (!corp.ok) {
    fail('buildLineSummary setup', 'corporate validation failed')
    return
  }

  const summary = buildLineSummary(
    {
      name: 'บริษัท ทดสอบ (สมชาย ใจดี)',
      phone: '0812345678',
      lineId: '',
      note: '',
      profile: corp.profile,
      inquiry_source: 'corporate',
    },
    [],
    null,
  )
  assert('Corporate line summary header', summary.includes('ลูกค้าองค์กร'))
  assert('Corporate line summary no items note', summary.includes('ยังไม่ระบุ'))

  const lpOk = (await importShared('shared/utils/lpApplicationForm.ts')).validateLpApplicationForm(validLpInput())
  if (lpOk.ok) {
    const lpSummary = buildLpApplicationLineSummary({ ...lpOk.data })
    assert('LP line summary has Lifestyle Planner', lpSummary.includes('Lifestyle Planner'))
    assert('LP line summary has motivation', lpSummary.includes('ชอบงานขาย'))
  }
}

// ─── Unit: content paths & files ───────────────────────────────
async function testFilesAndRoutes() {
  console.log('\n[Files] routes & components exist')

  const required = [
    'supabase/migrations/0047_inquiry_source.sql',
    'supabase/migrations/0048_lp_applications.sql',
    'app/pages/corporate.vue',
    'app/pages/corporate/inquiry.vue',
    'app/pages/careers/apply.vue',
    'app/pages/admin/lp-applications.vue',
    'app/components/corporate/CorporateSubscribeSection.vue',
    'app/components/home/HomeLpCareersSection.vue',
    'app/components/careers/LpApplicationForm.vue',
    'server/api/public/lp-applications.post.ts',
    'server/api/admin/lp-applications/index.get.ts',
  ]

  for (const rel of required) {
    assert(`file exists: ${rel}`, existsSync(resolve(ROOT, rel)))
  }

  const { CORPORATE_INQUIRY_PATH, CORPORATE_PAGE_PATH } = await importShared('shared/utils/corporateSection.ts')
  const { LP_APPLY_PATH } = await importShared('shared/utils/lpApplicationContent.ts')
  assert('CORPORATE_INQUIRY_PATH', CORPORATE_INQUIRY_PATH === '/corporate/inquiry')
  assert('LP_APPLY_PATH', LP_APPLY_PATH === '/careers/apply')

  const indexHtml = readFileSync(resolve(ROOT, 'app/pages/index.vue'), 'utf8')
  assert('index has CorporateSubscribeSection', indexHtml.includes('CorporateSubscribeSection'))
  assert('index has HomeLpCareersSection', indexHtml.includes('HomeLpCareersSection'))

  const sidebar = readFileSync(resolve(ROOT, 'app/components/admin/Sidebar.vue'), 'utf8')
  assert('admin sidebar LP menu', sidebar.includes('/admin/lp-applications'))
}

// ─── Unit: inquiry export column ───────────────────────────────
async function testInquiryExport() {
  console.log('\n[Export] inquiry source column')
  const { INQUIRY_EXPORT_HEADERS } = await importShared('shared/utils/inquiryExport.ts')
  assert('export has แหล่งคำขอ column', INQUIRY_EXPORT_HEADERS.includes('แหล่งคำขอ'))
}

// ─── Live HTTP ─────────────────────────────────────────────────
async function testLiveHttp() {
  console.log(`\n[HTTP] live tests against ${BASE}`)

  let homeOk = false
  try {
    const homeRes = await fetch(`${BASE}/`)
    homeOk = homeRes.ok
    const html = await homeRes.text()
    assert('GET / returns 200', homeRes.ok)
    assert('Homepage has LP section title', html.includes('สมัครร่วมงานกับเรา'))
    assert('Homepage has corporate section', html.includes('ลูกค้าองค์กรและภาคธุรกิจ'))
    assert('Homepage LP apply CTA', html.includes('กรอกใบสมัคร LP'))
    assert('Homepage corporate apply CTA', html.includes('กรอกข้อมูลสำหรับองค์กร'))
  }
  catch (err) {
    fail('GET /', err instanceof Error ? err.message : String(err))
  }

  if (!homeOk) return

  for (const path of ['/careers/apply', '/corporate/inquiry', '/corporate']) {
    try {
      const res = await fetch(`${BASE}${path}`)
      const html = await res.text()
      assert(`GET ${path} returns 200`, res.ok)
      if (path === '/careers/apply') {
        assert(`${path} has apply page title`, html.includes('สมัคร LP') || html.includes('กรอกข้อมูลสำหรับองค์กร'))
        assert(`${path} no unresolved LpApplicationForm`, !html.includes('Failed to resolve component: LpApplicationForm'))
      }
      if (path === '/corporate/inquiry') {
        assert(`${path} locked corporate form`, html.includes('นิติบุคคล') || html.includes('กรอกข้อมูลสำหรับองค์กร'))
      }
    }
    catch (err) {
      fail(`GET ${path}`, err instanceof Error ? err.message : String(err))
    }
  }

  // API validation-only (no DB write)
  try {
    const badLp = await fetch(`${BASE}/api/public/lp-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validLpInput({ security_code: 'bad' })),
    })
    assert('POST lp-applications rejects bad captcha (400)', badLp.status === 400)
  }
  catch (err) {
    fail('POST lp-applications validation', err instanceof Error ? err.message : String(err))
  }

  try {
    const badCorp = await fetch(`${BASE}/api/public/subscribe-inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCorporateInquiry({ security_code: 'bad' })),
    })
    assert('POST subscribe-inquiries corporate rejects bad captcha (400)', badCorp.status === 400)
  }
  catch (err) {
    fail('POST subscribe-inquiries validation', err instanceof Error ? err.message : String(err))
  }

  try {
    const noProducts = await fetch(`${BASE}/api/public/subscribe-inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicant_type: 'individual',
        inquiry_source: 'product_cart',
        first_name: 'ทดสอบ',
        last_name: 'ระบบ',
        contact_phone: '0812345678',
        address_line: '1',
        subdistrict: 'a',
        district: 'b',
        province: 'c',
        postal_code: '10110',
        security_code: 't',
        security_code_expected: 't',
        items: [],
      }),
    })
    assert('POST cart inquiry without items returns 400', noProducts.status === 400)
  }
  catch (err) {
    fail('POST cart inquiry empty items', err instanceof Error ? err.message : String(err))
  }

  // DB writes (optional — report migration hint on schema errors)
  const created = { lpId: null, inquiryId: null }

  try {
    const lpRes = await fetch(`${BASE}/api/public/lp-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validLpInput({
        email: `lp.smoke.${Date.now()}@example.com`,
        line_id: `@lp_smoke_${Date.now()}`,
      })),
    })
    const lpBody = await lpRes.json().catch(() => ({}))
    if (lpRes.status === 400 && String(lpBody?.message || '').includes('lp_applications')) {
      fail('POST lp-applications insert', `ตารางยังไม่มี — รัน migration 0048 (${lpBody.message})`)
    }
    else {
      assert('POST lp-applications insert 200', lpRes.ok, `status=${lpRes.status} ${JSON.stringify(lpBody)}`)
      if (lpRes.ok && lpBody?.id) {
        created.lpId = lpBody.id
        pass('LP application id returned', lpBody.id.slice(0, 8))
      }
    }
  }
  catch (err) {
    fail('POST lp-applications insert', err instanceof Error ? err.message : String(err))
  }

  try {
    const corpRes = await fetch(`${BASE}/api/public/subscribe-inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCorporateInquiry({
        company_name: `บริษัท สมัครทดสอบ ${Date.now()} จำกัด`,
      })),
    })
    const corpBody = await corpRes.json().catch(() => ({}))
    const msg = String(corpBody?.message || '')
    if (corpRes.status === 400 && (msg.includes('inquiry_source') || msg.includes('column'))) {
      fail('POST corporate inquiry insert', `รัน migration 0047 — ${msg}`)
    }
    else {
      assert('POST corporate inquiry without cart 200', corpRes.ok, `status=${corpRes.status} ${msg}`)
      if (corpRes.ok && corpBody?.id) {
        created.inquiryId = corpBody.id
        pass('Corporate inquiry id returned', corpBody.id.slice(0, 8))
        if (corpBody.line_summary) {
          assert('Corporate line_summary in response', corpBody.line_summary.includes('ลูกค้าองค์กร'))
        }
      }
    }
  }
  catch (err) {
    fail('POST corporate inquiry insert', err instanceof Error ? err.message : String(err))
  }

  if (created.lpId || created.inquiryId) {
    console.log('\n  ℹ Smoke records created (ลบในแอดมินหรือ Supabase ได้):')
    if (created.lpId) console.log(`    LP: ${created.lpId}`)
    if (created.inquiryId) console.log(`    Corporate inquiry: ${created.inquiryId}`)
  }
}

// ─── Main ──────────────────────────────────────────────────────
console.log('=== Test: new storefront features (corporate + LP) ===')
console.log(`mode: ${LIVE ? 'unit + live HTTP' : 'unit only'}`)

await testLpForm()
await testCorporateInquiryValidation()
await testSummariesAndLabels()
await testFilesAndRoutes()
await testInquiryExport()

if (LIVE) {
  await testLiveHttp()
}
else {
  console.log('\n  ↳ ข้าม HTTP — รันด้วย --live เมื่อ dev server + migration พร้อม')
}

console.log(`\n--- ${passes.length} passed, ${failures.length} failed ---`)
if (failures.length) {
  console.error('\nFailures:')
  for (const f of failures) console.error(`  • ${f}`)
  process.exit(1)
}

console.log('\nALL PASS')
process.exit(0)
