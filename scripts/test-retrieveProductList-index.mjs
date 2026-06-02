/** ทดสอบ parser API จาก respon_tvs.md */
import { readFileSync } from 'node:fs'
import { indexRetrieveProductList } from '../server/utils/lgRetrieveProductList.ts'

let raw = readFileSync('respon_tvs.md', 'utf8')
raw = raw.replace(/\[([A-Z0-9.]+)\]\([^)]+\)/g, '$1')
const body = JSON.parse(raw)
const index = indexRetrieveProductList(body)
console.log('indexed SKUs:', index.size)
for (const [sku, row] of index) {
  console.log(' ', sku, row.userFriendlyName?.slice(0, 50) ?? '')
}
