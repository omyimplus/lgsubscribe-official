import { launchLgBrowser } from '../server/utils/lgBrowserLaunch.ts'
import { createImportLogger } from '../server/utils/lgImportLog.ts'

const url = 'https://www.lg.com/th/tv-soundbars/all-tvs-soundbars/'

async function main() {
  const log = createImportLogger('badge-probe')
  const browser = await launchLgBrowser(log)
  const page = await browser.newPage()
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 180000 }).catch(() =>
      page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 }),
    )
    await page.waitForTimeout(4000)
    for (const label of ['ยอมรับทั้งหมด', 'Accept all']) {
      const btn = page.getByRole('button', { name: label }).first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(2000)
        break
      }
    }
    await page.locator('li.c-product-list__item.neo-card').first().waitFor({ state: 'visible', timeout: 90000 })

    const data = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('li.c-product-list__item.neo-card'))
      return cards.slice(0, 12).map((el, i) => {
        const title = (el.querySelector('h3')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70)
        const htmlSnippet = (el.innerHTML || '').slice(0, 2500)
        const subInHtml = /subscription/i.test(htmlSnippet)
        const badges = Array.from(el.querySelectorAll('*'))
          .filter(n => /subscription/i.test(n.textContent || '') && (n.textContent || '').length < 30)
          .slice(0, 5)
          .map(n => ({
            tag: n.tagName,
            class: n.className?.toString?.().slice(0, 80) || '',
            text: (n.textContent || '').replace(/\s+/g, ' ').trim(),
          }))
        return { i, title, subInHtml, badges }
      })
    })

    console.log('cards:', data.length)
    for (const row of data) {
      console.log('\n--- card', row.i, row.title)
      console.log('subInHtml:', row.subInHtml, 'badges:', JSON.stringify(row.badges))
    }

    const subCount = data.filter(d => d.subInHtml || d.badges.length).length
    console.log('\nSubscription signal in first page:', subCount, '/', data.length)
  }
  finally {
    await browser.close()
  }
}

main().catch(console.error)
