/**
 * ทดสอบเร็ว: node scripts/test-plp-scrape.mjs
 */
import { collectTvListCardsWithBrowser } from '../server/utils/lgTvImport.ts'
import { LG_TV_LIST_URL } from '../server/utils/lgSubscriptionSources.ts'

const started = Date.now()
console.log('เริ่ม scrape TV PLP (limit 30)…')
try {
  const cards = await collectTvListCardsWithBrowser(30, LG_TV_LIST_URL)
  console.log(`เสร็จใน ${((Date.now() - started) / 1000).toFixed(1)}s — ${cards.length} รายการ`)
  for (const c of cards.slice(0, 10)) {
    console.log(`  ${c.model_key} | ${c.variant_label ?? '-'} | ฿${c.base_price}/เดือน`)
  }
}
catch (err) {
  console.error('ล้มเหลว:', err?.message ?? err)
  process.exit(1)
}
