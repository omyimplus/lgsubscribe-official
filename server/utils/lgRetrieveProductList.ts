import type { Page } from 'playwright'
import { createImportLogger } from './lgImportLog'
import { skuFromLgModelId } from './lgSubscriptionSources'
import type { DomCardRaw } from './lgListCardDomScrape'

const RETRIEVE_PRODUCT_LIST_URL =
  'https://www.lg.com/ncms/asia/api/v1/proxy/retrieveProductList?locale=TH'

export type LgApiSibling = {
  sku: string
  siblingValue: string | null
  siblingCode: string | null
}

export type LgApiProduct = {
  modelName: string
  sku: string
  userFriendlyName: string | null
  modelUrlPath: string | null
  inchCode: string | null
  mediumImageAddr: string | null
  siblingModels: LgApiSibling[] | null
}

type RetrieveProductListBody = {
  code?: number
  productLists?: Array<{
    productList?: Array<Record<string, unknown>>
  }>
}

function normalizeApiSku(raw: unknown) {
  return skuFromLgModelId(String(raw ?? ''))
}

/** แปลง response เป็น map SKU → ข้อมูล API (รวม sibling แต่ไม่เพิ่มรายการใหม่ตอน enrich) */
export function indexRetrieveProductList(body: RetrieveProductListBody) {
  const bySku = new Map<string, LgApiProduct>()
  const lists = body.productLists ?? []
  for (const block of lists) {
    for (const row of block.productList ?? []) {
      const parentSku = normalizeApiSku(row.sku ?? row.modelName)
      const entry: LgApiProduct = {
        modelName: String(row.modelName ?? ''),
        sku: parentSku,
        userFriendlyName: row.userFriendlyName ? String(row.userFriendlyName) : null,
        modelUrlPath: row.modelUrlPath ? String(row.modelUrlPath) : null,
        inchCode: row.inchCode != null ? String(row.inchCode) : null,
        mediumImageAddr: row.mediumImageAddr ? String(row.mediumImageAddr) : null,
        siblingModels: null,
      }
      const siblings = Array.isArray(row.siblingModels) ? row.siblingModels : null
      if (siblings?.length) {
        entry.siblingModels = siblings.map((s: Record<string, unknown>) => ({
          sku: normalizeApiSku(s.sku),
          siblingValue: s.siblingValue ? String(s.siblingValue) : null,
          siblingCode: s.siblingCode ? String(s.siblingCode) : null,
        })).filter(s => s.sku)
      }
      if (parentSku) bySku.set(parentSku, entry)
      for (const s of entry.siblingModels ?? []) {
        if (!s.sku || bySku.has(s.sku)) continue
        bySku.set(s.sku, {
          modelName: s.sku,
          sku: s.sku,
          userFriendlyName: entry.userFriendlyName,
          modelUrlPath: entry.modelUrlPath,
          inchCode: s.siblingCode,
          mediumImageAddr: entry.mediumImageAddr,
          siblingModels: entry.siblingModels,
        })
      }
    }
  }
  return bySku
}

/** ยิง API ใน browser context (ใช้ cookie/session หน้า PLP) */
export async function fetchRetrieveProductListInPage(
  page: Page,
  fullSkus: string[],
  listPath = '/th/subscription/tvs/',
) {
  const log = createImportLogger('lg-api')
  if (!fullSkus.length) return new Map<string, LgApiProduct>()

  const skuList = [...new Set(fullSkus.filter(Boolean))].join(',')
  log.info(`retrieveProductList — ${fullSkus.length} SKU(s)`)

  const body = await page.evaluate(
    async ({ url, skuList: list, path }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-lge-localecode': 'TH',
          'ncms-debug-path': path,
        },
        body: JSON.stringify({
          bizType: 'B2C',
          isMember: 'Y',
          productList: [{ skuList: list }],
          subscribeProduct: 'N',
          pageType: 'PLP',
        }),
      })
      if (!res.ok) {
        return { error: `HTTP ${res.status}`, code: res.status }
      }
      return await res.json()
    },
    { url: RETRIEVE_PRODUCT_LIST_URL, skuList, path: listPath },
  ) as RetrieveProductListBody & { error?: string }

  if (body.error || body.code !== 200) {
    log.warn(`retrieveProductList failed: ${body.error ?? body.code ?? 'unknown'}`)
    return new Map<string, LgApiProduct>()
  }

  const index = indexRetrieveProductList(body)
  log.done(`retrieveProductList — ${index.size} SKU(s) indexed`)
  return index
}

/** เติมชื่อจาก API เท่านั้น — ไม่เพิ่ม/ลบแถวจาก DOM */
export function enrichDomRowsFromApi(
  rows: DomCardRaw[],
  apiBySku: Map<string, LgApiProduct>,
): DomCardRaw[] {
  if (!apiBySku.size) return rows
  return rows.map((row) => {
    const sku = (row.sku || '').toUpperCase()
    const api = apiBySku.get(sku)
    if (!api?.userFriendlyName) return row
    return {
      ...row,
      name: api.userFriendlyName,
    }
  })
}

/** รวบรวม full SKU สำหรับ skuList ใน request */
export function fullSkusForRetrieveRequest(rows: DomCardRaw[]) {
  const out: string[] = []
  for (const row of rows) {
    if (row.lgModelId) {
      out.push(row.lgModelId.includes('.') ? row.lgModelId : `${row.lgModelId}.ATM.EATH.TH.C`)
    }
    else if (row.sku) {
      out.push(`${row.sku}.ATM.EATH.TH.C`)
    }
  }
  return out
}
