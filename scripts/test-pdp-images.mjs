/**
 * ทดสอบดึงรูปจาก PDP LG
 * node scripts/test-pdp-images.mjs [detailUrl]
 */
import { extractPdpImageUrls } from '../server/utils/lgPdpImages.ts'

const url = process.argv[2] || 'https://www.lg.com/th/tv-soundbars/oled-evo/oled65c6psa/lgsubscribe'

const res = await fetch(url, {
  headers: {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0.0.0 Safari/537.36',
    'accept-language': 'th-TH,th;q=0.9',
  },
})
const html = await res.text()
const images = extractPdpImageUrls(html)

console.log('URL:', url)
console.log('HTTP:', res.status, 'html:', html.length)
console.log('images:', images.length)
for (const [i, img] of images.entries()) {
  const head = await fetch(img, {
    method: 'HEAD',
    headers: { referer: url, 'user-agent': 'Mozilla/5.0' },
  }).catch(() => null)
  console.log(`${i + 1}. [${head?.status ?? '?'}] ${img.slice(0, 100)}${img.length > 100 ? '…' : ''}`)
}

if (!images.length) {
  console.error('FAIL: no images')
  process.exit(1)
}
