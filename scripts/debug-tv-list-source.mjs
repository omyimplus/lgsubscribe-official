import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const URL = 'https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE'

async function main() {
  const outDir = resolve(process.cwd(), 'tmp')
  await mkdir(outDir, { recursive: true })

  let browser
  try {
    browser = await chromium.launch({ headless: true })
  }
  catch {
    browser = await chromium.launch({ headless: true, channel: 'chrome' })
  }

  const context = await browser.newContext()
  const page = await context.newPage()

  const hits = []
  page.on('response', async (res) => {
    const u = res.url()
    if (
      u.includes('retrieveProductList')
      || u.includes('/subscription/tvs/jcr:content')
      || u.includes('ncms-v2.json')
    ) {
      try {
        const text = await res.text()
        hits.push({
          url: u,
          status: res.status(),
          contentType: res.headers()['content-type'] || '',
          body: text.slice(0, 300000),
        })
      }
      catch {
        // ignore
      }
    }
  })

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(5000)

  for (const label of ['Accept all', 'Reject All', 'ยอมรับทั้งหมด']) {
    const btn = page.getByRole('button', { name: label }).first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {})
      await page.waitForTimeout(1000)
      break
    }
  }

  await page.waitForTimeout(4000)

  const html = await page.content()
  await writeFile(resolve(outDir, 'tv-list-page.html'), html, 'utf8')
  await writeFile(resolve(outDir, 'tv-list-network.json'), JSON.stringify(hits, null, 2), 'utf8')

  console.log(`captured network hits: ${hits.length}`)
  console.log(`saved: ${resolve(outDir, 'tv-list-network.json')}`)
  console.log(`saved: ${resolve(outDir, 'tv-list-page.html')}`)

  await context.close()
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
