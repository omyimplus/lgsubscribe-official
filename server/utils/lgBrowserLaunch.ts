import { existsSync } from 'node:fs'
import type { LaunchOptions } from 'playwright'
import type { ImportLogger } from './lgImportLog'

const MAC_CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const LINUX_CHROME_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const LINUX_CHROME_PATHS = [
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
]

export const LG_STEALTH_LAUNCH_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--window-size=1366,900',
]

export type LgScrapeProfile = {
  userAgent: string
  navigatorPlatform: string
  headless: boolean
}

/** VPS/Linux ใช้ UA + platform ให้ตรง Chrome จริง — ลด Akamai mismatch */
export function getLgScrapeProfile(): LgScrapeProfile {
  const userAgent = process.env.LG_SCRAPE_USER_AGENT?.trim()
    || (useLinuxScrapeProfile() ? LINUX_CHROME_UA : MAC_CHROME_UA)

  const navigatorPlatform = userAgent.includes('Linux')
    ? 'Linux x86_64'
    : 'MacIntel'

  return {
    userAgent,
    navigatorPlatform,
    headless: !shouldUseHeadfulBrowser(),
  }
}

function useLinuxScrapeProfile() {
  if (process.env.LG_SCRAPE_USER_AGENT?.trim()) {
    return process.env.LG_SCRAPE_USER_AGENT.includes('Linux')
  }
  return process.platform === 'linux' || process.env.LG_SCRAPE_VPS === '1'
}

/** Headful ผ่าน Akamai ได้ดีกว่า — บน VPS ต้องมี Xvfb + DISPLAY */
function shouldUseHeadfulBrowser() {
  if (process.env.LG_SCRAPE_HEADFUL === '1') return true
  if (process.env.LG_SCRAPE_HEADFUL === '0') return false
  // macOS dev — headless มักโดน Akamai 403 (หน้า PLP ว่าง)
  if (process.platform === 'darwin') return true
  return process.platform === 'linux' && Boolean(process.env.DISPLAY?.trim())
}

function chromeExecutableCandidates(): string[] {
  const custom = process.env.LG_CHROME_PATH?.trim()
  if (custom) return [custom]
  return LINUX_CHROME_PATHS.filter(p => existsSync(p))
}

/** LG/Akamai — ใช้ Chrome จริงก่อน bundled Chromium; VPS ติด google-chrome-stable + Xvfb */
export async function launchLgBrowser(log: ImportLogger) {
  const { chromium } = await import('playwright')
  const profile = getLgScrapeProfile()
  const args = LG_STEALTH_LAUNCH_ARGS
  const headless = profile.headless

  if (!headless && process.platform === 'linux' && !process.env.DISPLAY?.trim()) {
    log.warn(
      'LG_SCRAPE_HEADFUL=1 แต่ไม่มี DISPLAY — ติดตั้ง xvfb แล้วรัน: Xvfb :99 -screen 0 1366x900x24 & และ export DISPLAY=:99',
    )
  }

  const attempts: Array<{ label: string, options: LaunchOptions }> = []

  attempts.push({
    label: `channel:chrome (${headless ? 'headless' : 'headed'})`,
    options: { headless, channel: 'chrome', args },
  })

  for (const executablePath of chromeExecutableCandidates()) {
    attempts.push({
      label: `${executablePath} (${headless ? 'headless' : 'headed'})`,
      options: { headless, executablePath, args },
    })
  }

  attempts.push({
    label: `bundled Chromium (${headless ? 'headless' : 'headed'})`,
    options: { headless, args },
  })

  let lastErr: unknown
  for (const attempt of attempts) {
    try {
      const browser = await chromium.launch(attempt.options)
      log.info(`browser: ${attempt.label}`)
      log.info(`scrape profile: UA=${profile.userAgent.includes('Linux') ? 'Linux' : 'Mac'}, headless=${headless}`)
      return browser
    }
    catch (err: unknown) {
      lastErr = err
      const message = err instanceof Error ? err.message : String(err)
      log.warn(`browser launch failed (${attempt.label}): ${message}`)
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error('ไม่สามารถเปิดเบราว์เซอร์สำหรับ scrape LG ได้')
}
