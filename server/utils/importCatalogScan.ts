import {
  collectTvListCardsWithBrowser,
  normalizeModelKeyFromUrl,
  type TvListCard,
} from '~~/server/utils/lgTvImport'
import { createImportLogger, resetImportLogClock } from '~~/server/utils/lgImportLog'
import {
  getImportableLgSubscriptionSources,
  getLgSubscriptionSource,
  lgSubscriptionListPath,
  type LgSubscriptionSource,
} from '~~/server/utils/lgSubscriptionSources'
import { groupCatalogItems } from '~~/server/utils/productGroups'
import type { SupabaseClient } from '@supabase/supabase-js'

function resolveSku(card: TvListCard) {
  return (card.model_key || normalizeModelKeyFromUrl(card.source_url) || '').toUpperCase()
}

export function resolveCatalogSourceFromSlug(lgSlugOrCategory: string) {
  const lgSlug = String(lgSlugOrCategory ?? 'tvs').trim().toLowerCase()
  const source = getLgSubscriptionSource(lgSlug)
  if (!source?.categorySlug) {
    const allowed = getImportableLgSubscriptionSources().map(s => s.lgSlug).join(', ')
    throw createError({
      statusCode: 400,
      message: `ไม่รู้จักหมวด "${lgSlug}" — ใช้ lgSlug หนึ่งใน: ${allowed}`,
    })
  }
  return source as LgSubscriptionSource & { categorySlug: string }
}

export type CatalogScanResult = {
  source: {
    lgSlug: string
    label: string
    listUrl: string
    categorySlug: string
    categoryId: string
    categoryName: string
    variantAxis: string
  }
  scannedAt: string
  totalOnLg: number
  newCount: number
  existsCount: number
  missingOnLgCount: number
  items: {
    sku: string
    name: string | null
    source_url: string
    base_price: number | null
    full_price: number | null
    variant_label: string | null
    lg_model_id: string | null
    variant_group_key: string | null
    shared_detail_url: string | null
    headline: string | null
    warranty_years: number | null
    subscription_note: string | null
    purchase_only_label: string | null
    purchase_only_url: string | null
    status: 'new' | 'exists'
  }[]
  groups: ReturnType<typeof groupCatalogItems>
  missingOnLg: { sku: string, name: string, status: 'missing_on_lg' }[]
}

export async function runImportCatalogScan(
  supabase: SupabaseClient,
  lgSlugOrCategory: string,
): Promise<CatalogScanResult> {
  resetImportLogClock()
  const log = createImportLogger('catalog')
  const source = resolveCatalogSourceFromSlug(lgSlugOrCategory)

  log.step(`fetch PLP cards (${source.lgSlug})`)
  const cards = await collectTvListCardsWithBrowser(500, source.listUrl, {
    lgSlug: source.lgSlug,
    listPath: lgSubscriptionListPath(source.lgSlug),
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'เปิดหน้าจอไม่ขึ้น'
    log.error(`fetch PLP failed: ${message}`)
    throw createError({ statusCode: 503, message })
  })
  log.done(`fetch PLP cards (${cards.length})`)

  const { data: categoryRow, error: catErr } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', source.categorySlug)
    .maybeSingle()

  if (catErr) throw createError({ statusCode: 500, message: catErr.message })
  if (!categoryRow?.id) {
    throw createError({
      statusCode: 400,
      message: `ไม่พบหมวด "${source.categorySlug}" ในระบบ — รัน migration seed categories`,
    })
  }

  log.step('load products for compare')
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('sku, name')
    .eq('category_id', categoryRow.id)

  if (prodErr) throw createError({ statusCode: 500, message: prodErr.message })
  log.done(`load products for compare (${products?.length ?? 0} rows in ${source.categorySlug})`)

  const productBySku = new Map(
    (products ?? []).map(row => [row.sku.toUpperCase(), row]),
  )
  const catalogSkus = new Set<string>()

  const items = cards.map((card) => {
    const sku = resolveSku(card)
    if (sku) catalogSkus.add(sku)
    return {
      sku,
      name: card.name,
      source_url: card.source_url,
      base_price: card.base_price,
      full_price: card.full_price,
      variant_label: card.variant_label ?? null,
      lg_model_id: card.lg_model_id ?? null,
      variant_group_key: card.variant_group_key ?? null,
      shared_detail_url: card.shared_detail_url ?? null,
      headline: card.headline ?? null,
      warranty_years: card.warranty_years ?? null,
      subscription_note: card.subscription_note ?? null,
      purchase_only_label: card.purchase_only_label ?? null,
      purchase_only_url: card.purchase_only_url ?? null,
      status: (sku && productBySku.has(sku) ? 'exists' : 'new') as 'new' | 'exists',
    }
  }).filter(item => item.sku)

  const missingOnLg = (products ?? [])
    .filter(row => !catalogSkus.has(row.sku.toUpperCase()))
    .map(row => ({
      sku: row.sku,
      name: row.name,
      status: 'missing_on_lg' as const,
    }))

  const groups = groupCatalogItems(items)

  log.info(`catalog response ready — ${items.length} SKU(s), ${groups.length} group(s) on LG (${source.lgSlug})`)

  return {
    source: {
      lgSlug: source.lgSlug,
      label: source.label,
      listUrl: source.listUrl,
      categorySlug: source.categorySlug,
      categoryId: categoryRow.id,
      categoryName: categoryRow.name,
      variantAxis: source.variantAxis,
    },
    scannedAt: new Date().toISOString(),
    totalOnLg: items.length,
    newCount: items.filter(i => i.status === 'new').length,
    existsCount: items.filter(i => i.status === 'exists').length,
    missingOnLgCount: missingOnLg.length,
    items,
    groups,
    missingOnLg,
  }
}
