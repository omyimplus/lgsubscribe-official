/**
 * สร้าง favicon จาก public/images/fav.png
 *   node scripts/generate-favicons.mjs
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import toIco from 'to-ico'

const ROOT = resolve(import.meta.dirname, '..')
const SOURCE = resolve(ROOT, 'public/images/fav.png')
const OUT = resolve(ROOT, 'public')

async function squarePng(size) {
  return sharp(SOURCE)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

async function main() {
  const pairs = [
    [16, 'favicon-16x16.png'],
    [32, 'favicon-32x32.png'],
    [180, 'apple-touch-icon.png'],
    [192, 'android-chrome-192x192.png'],
    [512, 'android-chrome-512x512.png'],
  ]

  const icoBuffers = []
  for (const [size, name] of pairs) {
    const buf = await squarePng(size)
    writeFileSync(resolve(OUT, name), buf)
    if (size <= 32) icoBuffers.push(buf)
    console.log(`  ✓ ${name} (${size}x${size})`)
  }

  writeFileSync(resolve(OUT, 'favicon.ico'), await toIco(icoBuffers))
  console.log('  ✓ favicon.ico')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
