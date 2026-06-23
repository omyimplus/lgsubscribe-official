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
  '/corporate/inquiry',
  '/contact',
  '/trust',
  '/faq',
  '/installment',
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
    { path: '/faq', indexable: true },
    { path: '/corporate/inquiry', indexable: false },
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
    assert('Footer TikTok icon', home.html.includes('simple-icons:tiktok') || home.html.includes('i-simple-icons--tiktok') || home.html.includes('href="https://www.tiktok.com'))
    assert('Footer Facebook icon', home.html.includes('mdi:facebook') || home.html.includes('i-mdi:facebook'))

    const robots = await fetch(`${BASE}/robots.txt`).then(r => r.text())
    assert('robots.txt OK', robots.includes('Sitemap:') && robots.includes('Disallow: /admin'))

    const sitemap = await fetch(`${BASE}/sitemap.xml`).then(r => r.text())
    assert('sitemap.xml OK', sitemap.includes('<urlset') && sitemap.includes('/products'))

    const corp = await fetchText('/corporate/inquiry')
    assert('Corporate inquiry form', corp.html.includes('ชื่อบริษัท'))
    assert('Corporate inquiry not landing', !corp.html.includes('สนใจสมัคร LG Subscribe สำหรับองค์กร?'))

    const careers = await fetchText('/careers/apply')
    assert('LP apply form', careers.html.includes('ส่งใบสมัคร') || careers.html.includes('Lifestyle Planner'))
    assert('LP form component resolved', !careers.html.includes('Failed to resolve component: LpApplicationForm'))
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

async function main() {
  console.log('=== Storefront regression (SEO + speed) ===')
  console.log(`base: ${BASE}`)

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
