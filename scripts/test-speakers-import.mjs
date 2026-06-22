/**
 * ทดสอบ speakers URL — scrape + PDP probe + SKU regex import
 * npx tsx scripts/test-speakers-import.mjs
 */
import {
  collectTvListCardsWithBrowser,
  probeTvDetailUrl,
  parseTvDetail,
  resolveGroupDetailUrl,
} from '../server/utils/lgTvImport.ts'
import { createImportLogger } from '../server/utils/lgImportLog.ts'
import { lgListPathFromUrl, normalizeLgCategoryListUrl } from '../server/utils/lgCategoryUrl.ts'

import { isValidLgProductSku } from '../server/utils/lgSubscriptionSources.ts'

const IMPORT_SKU_RE = isValidLgProductSku

async function main() {
  const url = normalizeLgCategoryListUrl('https://www.lg.com/th/speakers/all-speakers/')
  const log = createImportLogger('speakers-test')

  for (const badgeOnly of [true, false]) {
    console.log('\n' + '='.repeat(72))
    console.log(`subscriptionBadgeOnly=${badgeOnly}`)
    console.log('='.repeat(72))

    const cards = await collectTvListCardsWithBrowser(500, url, {
      listPath: lgListPathFromUrl(url),
      allowEmpty: true,
      subscriptionBadgeOnly: badgeOnly,
      skipCardPrices: true,
    })

    console.log(`Cards: ${cards.length}`)
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i]
      const sku = (c.model_key || '').toUpperCase()
      console.log(`\n[${i + 1}] SKU=${sku} name=${c.name?.slice(0, 55)}`)
      console.log(`    url=${c.source_url}`)
      console.log(`    import sku valid: ${IMPORT_SKU_RE(sku) ? 'PASS' : 'FAIL'}`)

      const ok = await probeTvDetailUrl(c.source_url)
      console.log(`    probe PDP: ${ok ? 'OK' : 'FAIL'}`)
      if (ok) {
        try {
          const p = await parseTvDetail(c.source_url)
          console.log(`    parse: sku=${p.sku} images=${p.image_urls?.length ?? 0} base=${p.base_price}`)
        }
        catch (e) {
          console.log(`    parse FAIL: ${e.message}`)
        }
      }
      try {
        await resolveGroupDetailUrl([c], log)
        console.log('    resolveGroupDetailUrl: OK')
      }
      catch (e) {
        console.log(`    resolveGroupDetailUrl FAIL: ${e.message}`)
      }
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
