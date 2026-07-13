/**
 * Regression test หลัง SEO / speed — ตรวจหน้าร้านทั้งหมดไม่พัง
 *
 *   npm run build && node .output/server/index.mjs &
 *   npm run test:storefront-regression
 *
 * หรือกับ dev server:
 *   npm run dev &
 *   npm run test:storefront-regression
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

const STATIC_ROUTES = [
  '/',
  '/products',
  '/promotions',
  '/articles',
  '/articles/knowledge',
  '/articles/how-to-order',
  '/articles/why-subscribe',
  '/corporate',
  '/contact',
  '/trust',
  '/faq',
  '/installment',
  '/privacy',
  '/experiences',
  '/careers/apply',
  '/subscribe/inquiry',
  '/auth/login',
  '/auth/register',
  '/account',
]

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

function assert(name, condition, detail = 'failed') {
  if (condition) pass(name)
  else fail(name, detail)
}

function assertNoNuxtErrors(label, html) {
  assert(`${label} no Nuxt component error`, !html.includes('Failed to resolve component'))
  assert(`${label} not error page`, !/<h1[^>]*>\s*500\s*<\/h1>/i.test(html) && !html.includes('Internal Server Error'))
  assert(`${label} has layout shell`, html.includes('site-header-container') || html.includes('LG Subscribe'))
}

function assertSeoBasics(label, html, { indexable = true } = {}) {
  assert(`${label} has <title>`, /<title[^>]*>[^<]+<\/title>/i.test(html))
  assert(`${label} has meta description`, html.includes('name="description"') || html.includes('property="og:description"'))
  assert(`${label} has canonical`, html.includes('rel="canonical"'))
  assert(`${label} has og:title`, html.includes('og:title') || html.includes('property="og:title"'))
  assert(`${label} has keywords`, html.includes('name="keywords"'))
  assert(`${label} has JSON-LD`, html.includes('application/ld+json'))
  if (indexable) {
    assert(`${label} indexable robots`, html.includes('index, follow') || html.includes('index,follow'))
  }
  else {
    assert(`${label} noindex`, html.includes('noindex'))
  }
}

async function fetchText(path) {
  const res = await fetch(`${BASE}${path}`)
  const html = await res.text()
  return { res, html }
}

async function testStaticRoutes() {
  console.log('\n[Routes] static storefront pages')
  for (const path of STATIC_ROUTES) {
    try {
      const { res, html } = await fetchText(path)
      assert(`GET ${path} → ${res.status}`, res.ok, `status=${res.status}`)
      assertNoNuxtErrors(path, html)
    }
    catch (err) {
      fail(`GET ${path}`, err instanceof Error ? err.message : String(err))
    }
  }
}

async function testSeoByPageType() {
  console.log('\n[SEO] per-page meta & robots')

  const cases = [
    { path: '/', indexable: true },
    { path: '/products', indexable: true },
    { path: '/contact', indexable: true },
    { path: '/privacy', indexable: true },
    { path: '/faq', indexable: true },
    { path: '/corporate', indexable: true },
    { path: '/subscribe/inquiry', indexable: false },
    { path: '/auth/login', indexable: false, seoOptional: true },
  ]

  for (const { path, indexable, seoOptional } of cases) {
    try {
      const { res, html } = await fetchText(path)
      if (!res.ok) {
        fail(`SEO ${path}`, `status=${res.status}`)
        continue
      }
      if (seoOptional) {
        assert(`${path} noindex`, html.includes('noindex'))
        assert(`${path} has JSON-LD org`, html.includes('application/ld+json'))
        continue
      }
      assertSeoBasics(path, html, { indexable })
    }
    catch (err) {
      fail(`SEO ${path}`, err instanceof Error ? err.message : String(err))
    }
  }
}

async function testDynamicRoutes() {
  console.log('\n[Dynamic] product / article / promotion / experience')

  try {
    const products = await fetch(`${BASE}/api/public/products`).then(r => r.json())
    const articles = await fetch(`${BASE}/api/public/articles`).then(r => r.json())
    const promotions = await fetch(`${BASE}/api/public/promotions`).then(r => r.json())
    const experiences = await fetch(`${BASE}/api/public/customer-experiences`).then(r => r.json())

    const product = products?.[0]
    const article = articles?.[0]
    const promotion = promotions?.[0]
    const experience = experiences?.[0]

    if (product?.id) {
      const { res, html } = await fetchText(`/products/${product.id}`)
      assert(`GET /products/${product.id}`, res.ok)
      assertNoNuxtErrors('PDP', html)
      assertSeoBasics('PDP', html)
      assert('PDP Product JSON-LD', html.includes('"@type":"Product"') || html.includes('"@type": "Product"'))
    }
    else fail('PDP sample', 'no published products')

    if (article?.slug) {
      const { res, html } = await fetchText(`/articles/${article.slug}`)
      assert(`GET /articles/${article.slug}`, res.ok)
      assertNoNuxtErrors('Article', html)
      assertSeoBasics('Article', html)
      assert('Article JSON-LD', html.includes('"@type":"Article"') || html.includes('"@type": "Article"'))
    }
    else fail('Article sample', 'no published articles')

    if (promotion?.slug) {
      const { res, html } = await fetchText(`/promotions/${promotion.slug}`)
      assert(`GET /promotions/${promotion.slug}`, res.ok)
      assertNoNuxtErrors('Promotion', html)
      assertSeoBasics('Promotion', html)
    }
    else pass('Promotion sample skipped', 'no promotions')

    if (experience?.id) {
      const { res, html } = await fetchText(`/experiences/${experience.id}`)
      assert(`GET /experiences/${experience.id}`, res.ok)
      assertNoNuxtErrors('Experience', html)
      assertSeoBasics('Experience', html)
    }
    else pass('Experience sample skipped', 'no experiences')
  }
  catch (err) {
    fail('Dynamic routes', err instanceof Error ? err.message : String(err))
  }
}

async function testSeoInfra() {
  console.log('\n[SEO infra] robots / sitemap / footer / corporate form')

  try {
    const home = await fetchText('/')
    assert('Homepage lang=th', home.html.includes('lang="th"'))
    assert('Homepage WebSite JSON-LD', home.html.includes('"@type":"WebSite"') || home.html.includes('"@type": "WebSite"'))
    assert('Homepage Organization JSON-LD', home.html.includes('"@type":"Organization"') || home.html.includes('"@type": "Organization"'))
    assert('Footer TikTok link', home.html.includes('tiktok.com'))
    assert('Footer TikTok icon', home.html.includes('M19.59 6.69') || home.html.includes('simple-icons:tiktok') || home.html.includes('i-simple-icons--tiktok') || home.html.includes('href="https://www.tiktok.com'))
    assert('Footer Facebook icon', home.html.includes('mdi:facebook') || home.html.includes('i-mdi:facebook'))
    assert('Footer terms link label', home.html.includes('ข้อกำหนดและเงื่อนไขให้บริการ'))
    assert('Footer no warranty help link', !home.html.includes('>การรับประกัน</a>'))
    assert('Footer TV label', home.html.includes('>ทีวี</a>') || home.html.includes('category=television'))

    const robots = await fetch(`${BASE}/robots.txt`).then(r => r.text())
    assert('robots.txt OK', robots.includes('Disallow: /admin'))
    assert('robots no corporate inquiry', !robots.includes('/corporate/inquiry'))
    assert('robots sitemap absolute URL', /Sitemap:\s+https?:\/\//.test(robots))

    const sitemap = await fetch(`${BASE}/sitemap.xml`).then(r => r.text())
    assert('sitemap.xml OK', sitemap.includes('<urlset') && sitemap.includes('/products'))
    assert('sitemap privacy', sitemap.includes('/privacy'))
    assert('sitemap no corporate inquiry', !sitemap.includes('/corporate/inquiry'))
    assert('Footer privacy link', home.html.includes('href="/privacy"') || home.html.includes("to:\"/privacy\""))

    const corp = await fetchText('/corporate')
    assert('Corporate Line CTA', corp.html.includes('แอดไลน์สอบถาม'))
    assert('Corporate opens Line directly', corp.html.includes('lin.ee') || corp.html.includes('line.me'))
    assert('Corporate no inquiry route', !corp.html.includes('/corporate/inquiry'))

    const corpInquiry = await fetch(`${BASE}/corporate/inquiry`)
    assert('Corporate inquiry removed (404)', corpInquiry.status === 404)

    const contact = await fetchText('/contact')
    assert('Contact 24h hours', contact.html.includes('24 ชั่วโมง'))
    assert('Contact company name', contact.html.includes('บริษัท LG อิเล็กทรอนิกส์ ไทยแลนด์'))

    const careers = await fetchText('/careers/apply')
    assert('LP apply form', careers.html.includes('ส่งใบสมัคร') || careers.html.includes('Lifestyle Planner'))
    assert('LP form component resolved', !careers.html.includes('Failed to resolve component: LpApplicationForm'))

    const trust = await fetchText('/trust')
    assert('Trust kapook cert image', trust.html.includes('/images/kapook-cer.webp'))
    assert('Trust page title', trust.html.includes('ความน่าเชื่อถือ'))
    assert('Trust uses slide images component', trust.html.includes('ภาพความน่าเชื่อถือ') || trust.html.includes('object-contain'))

    const installment = await fetchText('/installment')
    assert('Installment hub title', installment.html.includes('ข้อกำหนดและเงื่อนไขให้บริการ'))
    assert('Installment hub has 3 term cards', installment.html.includes('/installment/warranty') && installment.html.includes('/installment/maintenance') && installment.html.includes('/installment/service'))

    const warranty = await fetchText('/installment/warranty')
    assert('Installment warranty content', warranty.html.includes('ระยะเวลาการรับประกัน'))

    const service = await fetchText('/installment/service')
    assert('Installment service content', service.html.includes('ข้อกำหนดและเงื่อนไขการให้บริการ'))
  }
  catch (err) {
    fail('SEO infra', err instanceof Error ? err.message : String(err))
  }
}

async function testPublicApis() {
  console.log('\n[API] public endpoints still respond')

  const apis = [
    '/api/public/products',
    '/api/public/home-categories',
    '/api/public/featured-products',
    '/api/public/promotions',
    '/api/public/articles',
    '/api/public/faq-items',
    '/api/public/customer-experiences',
    '/api/public/lp-careers-page',
    '/api/public/trust-page',
  ]

  for (const path of apis) {
    try {
      const res = await fetch(`${BASE}${path}`)
      assert(`GET ${path}`, res.ok, `status=${res.status}`)
    }
    catch (err) {
      fail(`GET ${path}`, err instanceof Error ? err.message : String(err))
    }
  }
}

async function testSessionFiles() {
  console.log('\n[Files] session feature artifacts')
  const { existsSync, readFileSync } = await import('node:fs')
  const { resolve } = await import('node:path')
  const root = resolve(import.meta.dirname, '..')

  const required = [
    'app/components/SubscribeTermsDocument.vue',
    'shared/utils/subscribeTermsContent.ts',
    'shared/types/serviceCare.ts',
    'app/components/installment/ServiceCareSection.vue',
    'app/components/storefront/YoutubeVideoModal.vue',
    'supabase/migrations/0052_service_care_videos.sql',
    'app/components/SiteCookieConsent.vue',
    'app/components/trust/TrustPageSlideImages.vue',
    'app/composables/useStaffFormUpload.ts',
    'app/composables/useCookieConsent.ts',
    'server/utils/adminSlideUpload.ts',
    'shared/utils/cookieConsent.ts',
    'supabase/migrations/0049_lp_careers_page.sql',
    'supabase/migrations/0050_trust_page.sql',
  ]

  for (const rel of required) {
    assert(`file exists: ${rel}`, existsSync(resolve(root, rel)))
  }

  assert('corporate inquiry page removed', !existsSync(resolve(root, 'app/pages/corporate/inquiry.vue')))

  const footer = readFileSync(resolve(root, 'app/components/SiteFooter.vue'), 'utf8')
  assert('footer terms label', footer.includes('ข้อกำหนดและเงื่อนไขให้บริการ'))
  assert('footer no warranty link', !footer.includes('การรับประกัน'))

  const layout = readFileSync(resolve(root, 'app/layouts/default.vue'), 'utf8')
  assert('layout has cookie consent', layout.includes('SiteCookieConsent'))

  const corpSection = readFileSync(resolve(root, 'app/components/corporate/CorporateSubscribeSection.vue'), 'utf8')
  assert('corporate CTA opens Line', corpSection.includes('lineOaUrl') && corpSection.includes('target="_blank"'))
  assert('corporate CTA no inquiry path', !corpSection.includes('/corporate/inquiry'))
}

async function testSessionConstants() {
  console.log('\n[Unit] site contact & SEO constants')
  const { readFileSync } = await import('node:fs')
  const { resolve } = await import('node:path')
  const root = resolve(import.meta.dirname, '..')

  const siteContact = readFileSync(resolve(root, 'shared/utils/siteContact.ts'), 'utf8')
  assert('SITE_BUSINESS_HOURS 24h', siteContact.includes("SITE_BUSINESS_HOURS = '24 ชั่วโมง'"))
  assert('SITE_OFFICE_COMPANY_NAME', siteContact.includes('บริษัท แอลจี อีเลคทรอนิคส์ (ประเทศไทย) จำกัด'))

  const trustPage = readFileSync(resolve(root, 'shared/types/trustPage.ts'), 'utf8')
  assert('TRUST_KAPOOK_CERT_IMAGE path', trustPage.includes("'/images/kapook-cer.webp'"))

  const seoPresets = readFileSync(resolve(root, 'shared/utils/siteSeoPresets.ts'), 'utf8')
  assert('SEO_CONTACT mentions 24h', seoPresets.includes('24 ชั่วโมง'))
}

async function main() {
  console.log('=== Storefront regression (SEO + speed) ===')
  console.log(`base: ${BASE}`)

  await testSessionFiles()
  await testSessionConstants()

  try {
    const ping = await fetch(`${BASE}/`)
    if (!ping.ok) {
      console.error(`\nServer not ready at ${BASE} (status ${ping.status})`)
      console.error('Run: npm run build && node .output/server/index.mjs')
      process.exit(1)
    }
  }
  catch {
    console.error(`\nCannot reach ${BASE}`)
    console.error('Run: npm run build && node .output/server/index.mjs')
    process.exit(1)
  }

  await testStaticRoutes()
  await testSeoByPageType()
  await testDynamicRoutes()
  await testSeoInfra()
  await testPublicApis()

  console.log(`\n--- ${passes.length} passed, ${failures.length} failed ---`)
  if (failures.length) {
    console.error('\nFAILED')
    for (const f of failures) console.error(`  • ${f}`)
    process.exit(1)
  }
  console.log('\nALL PASS — no regression detected')
}

main()
