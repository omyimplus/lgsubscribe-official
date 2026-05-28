import { chromium } from 'playwright'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const URL = 'https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE'
const HOLD_MS = Number(process.env.HOLD_MS || 0)
const HEADLESS = process.env.HEADLESS === '1'
const AUTO_CLOSE = process.env.AUTO_CLOSE === '1'

async function main() {
  let browser
  try {
    browser = await chromium.launch({
      headless: HEADLESS,
      slowMo: 80,
    })
  }
  catch {
    // Fallback to local Chrome when bundled Chromium is unavailable.
    browser = await chromium.launch({
      channel: 'chrome',
      headless: HEADLESS,
      slowMo: 80,
    })
  }

  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log(`[test] open: ${URL}`)
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 })

    // Try to accept cookie dialog if shown.
    for (const label of ['Accept all', 'ยอมรับทั้งหมด']) {
      const btn = page.getByRole('button', { name: label }).first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => {})
        break
      }
    }

    const priceReady = await page.waitForFunction(() => {
      const nodes = Array.from(document.querySelectorAll('.neo-price--price .cell-price'))
      return nodes.some((n) => /\d/.test((n.textContent || '').trim()))
    }, { timeout: 60000 }).then(() => true).catch(() => false)

    console.log(`[test] price selector ready: ${priceReady}`)
    if (AUTO_CLOSE) {
      const ms = HOLD_MS > 0 ? HOLD_MS : 30000
      console.log(`[test] keep browser open ${ms}ms (AUTO_CLOSE=1)`)
      await page.waitForTimeout(ms)
    }
    else {
      console.log('[test] browser will stay open. Press Enter in terminal to close.')
      const rl = readline.createInterface({ input, output })
      await rl.question('')
      rl.close()
    }
  }
  finally {
    await context.close()
    await browser.close()
    console.log('[test] browser closed')
  }
}

main().catch((error) => {
  console.error('[test] failed:', error)
  process.exit(1)
})
