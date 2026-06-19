import {
  mirrorImportedProductImages,
  mirrorImportedProductVideos,
} from '~~/server/utils/lgImageMirror'
import {
  collectTvListCardsWithBrowser,
  normalizeModelKeyFromUrl,
  parseTvDetail,
  resolveGroupDetailUrl,
  type TvListCard,
} from '~~/server/utils/lgTvImport'
import {
  buildVariantCardName,
  getLgSubscriptionSource,
  lgSubscriptionListPath,
  type LgSubscriptionSource,
} from '~~/server/utils/lgSubscriptionSources'
import { createImportLogger } from '~~/server/utils/lgImportLog'
import { parseVariantSort } from '~~/server/utils/productGroups'

type SupabaseAdmin = ReturnType<typeof useSupabaseAdmin>

function resolveCardSku(card: TvListCard) {
  return (card.model_key || normalizeModelKeyFromUrl(card.source_url) || '').toUpperCase()
}

function importDisplayName(
  parsedName: string | null,
  listCard: TvListCard,
  sku: string,
) {
  // PLP มีชื่อ/BTU ต่อ swatch แล้ว — แก้แค่รุ่น (SKU) ไม่ให้ PDP/swatch ทับ BTU
  if (listCard.name?.trim()) {
    return buildVariantCardName(listCard.name, null, sku)
  }
  return buildVariantCardName(parsedName, listCard.variant_label, sku)
}

function groupCardsByVariantGroup(cards: TvListCard[]) {
  const groups = new Map<string, TvListCard[]>()
  for (const card of cards) {
    const key = card.variant_group_key || `sku:${resolveCardSku(card)}`
    const list = groups.get(key) ?? []
    list.push(card)
    groups.set(key, list)
  }
  return groups
}

export function filterListCards(
  cards: TvListCard[],
  options: { skus?: string[], importAll?: boolean, testLimit?: number },
) {
  if (options.skus?.length) {
    const wanted = new Set(options.skus.map(s => s.toUpperCase()))
    return cards.filter(card => wanted.has(resolveCardSku(card)))
  }
  if (options.importAll) return cards
  return cards.slice(0, options.testLimit ?? 3)
}

export async function fetchTvListCards(
  max = 500,
  source?: Pick<LgSubscriptionSource, 'listUrl' | 'lgSlug'>,
) {
  if (!source?.listUrl) {
    return await collectTvListCardsWithBrowser(max)
  }
  return await collectTvListCardsWithBrowser(max, source.listUrl, {
    lgSlug: source.lgSlug,
    listPath: lgSubscriptionListPath(source.lgSlug),
  })
}

async function resolveCategoryId(
  supabase: SupabaseAdmin,
  categorySlug: string,
) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', categorySlug)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data?.id) {
    throw createError({
      statusCode: 400,
      message: `ไม่พบหมวด "${categorySlug}" ในระบบ — รัน seed categories`,
    })
  }
  return data
}

export function resolveImportSource(lgSlugOrCategorySlug?: string | null) {
  const key = (lgSlugOrCategorySlug || 'tvs').trim().toLowerCase()
  const source = getLgSubscriptionSource(key)
  if (!source?.categorySlug) {
    throw createError({
      statusCode: 400,
      message: `ไม่รู้จักหมวด import "${key}"`,
    })
  }
  return source as LgSubscriptionSource & { categorySlug: string }
}

export type ClientCatalogItem = {
  sku?: string | null
  name?: string | null
  source_url?: string | null
  base_price?: number | null
  full_price?: number | null
  variant_label?: string | null
  lg_model_id?: string | null
  variant_group_key?: string | null
  shared_detail_url?: string | null
  headline?: string | null
  warranty_years?: number | null
  subscription_note?: string | null
  purchase_only_label?: string | null
  purchase_only_url?: string | null
  categorySlug?: string | null
}

/** แปลง catalog items ที่ UI ส่งกลับมา → TvListCard (เลี่ยง scrape PLP ซ้ำ) */
export function cardsFromClientItems(items: ClientCatalogItem[]): TvListCard[] {
  return items
    .filter(item => item?.source_url)
    .map(item => ({
      source_url: String(item.source_url),
      model_key: (item.sku || '').toUpperCase() || null,
      name: item.name ?? null,
      headline: item.headline ?? null,
      base_price: item.base_price ?? null,
      full_price: item.full_price ?? null,
      warranty_years: item.warranty_years ?? null,
      subscription_note: item.subscription_note ?? null,
      purchase_only_label: item.purchase_only_label ?? null,
      purchase_only_url: item.purchase_only_url ?? null,
      lg_model_id: item.lg_model_id ?? null,
      variant_label: item.variant_label ?? null,
      variant_group_key: item.variant_group_key ?? null,
      shared_detail_url: item.shared_detail_url ?? null,
      categorySlug: item.categorySlug?.trim().toLowerCase() || null,
    }))
}

type ResolvedCategory = Awaited<ReturnType<typeof resolveCategoryId>>

async function resolveCategoryIdCached(
  supabase: SupabaseAdmin,
  categorySlug: string,
  cache: Map<string, ResolvedCategory>,
) {
  const slug = categorySlug.trim().toLowerCase()
  const cached = cache.get(slug)
  if (cached) return cached
  const row = await resolveCategoryId(supabase, slug)
  cache.set(slug, row)
  return row
}

export async function importTvCardsToDraft(
  supabase: SupabaseAdmin,
  listCards: TvListCard[],
  options?: { batchNote?: string, categorySlug?: string },
) {
  const log = createImportLogger('import-draft')
  const toImport = listCards.filter(card => card.source_url && resolveCardSku(card))
  if (!toImport.length) {
    throw createError({ statusCode: 400, message: 'ไม่พบรายการที่เลือก' })
  }

  const groups = groupCardsByVariantGroup(toImport)
  log.info(`importing ${toImport.length} SKU(s) in ${groups.size} product group(s)`)

  const defaultCategorySlug = options?.categorySlug ?? 'television'
  const categoryCache = new Map<string, ResolvedCategory>()
  const defaultCategory = await resolveCategoryIdCached(supabase, defaultCategorySlug, categoryCache)
  log.info(`default category: ${defaultCategory.name} (${defaultCategory.slug})`)

  const { data: batch, error: batchErr } = await supabase
    .from('import_batches')
    .insert({
      source: 'lg.com',
      status: 'draft',
      note: options?.batchNote ?? `LG import (${defaultCategory.slug})`,
    })
    .select('*')
    .single()

  if (batchErr || !batch) {
    throw createError({ statusCode: 500, message: batchErr?.message ?? 'สร้าง import batch ไม่สำเร็จ' })
  }

  const detailUrls: string[] = []
  const failed: { group: string, skus: string[], reason: string }[] = []
  let count = 0
  let groupIdx = 0

  for (const [groupKey, members] of groups) {
    groupIdx += 1
    const memberSkus = members.map(m => resolveCardSku(m))
    const skus = memberSkus.join(', ')
    log.step(`group ${groupIdx}/${groups.size} ${groupKey} (${members.length} SKU: ${skus})`)

    let detailUrl: string
    try {
      detailUrl = await resolveGroupDetailUrl(members, log)
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      log.error(`group detail failed (skip): ${message}`)
      failed.push({ group: groupKey, skus: memberSkus, reason: `ไม่พบหน้ารายละเอียดที่เปิดได้: ${message}` })
      continue
    }
    detailUrls.push(detailUrl)

    log.step(`group ${groupIdx} parse shared detail`)
    let parsed
    try {
      parsed = await parseTvDetail(detailUrl)
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      log.error(`parse failed group=${groupKey} url=${detailUrl} (skip): ${message}`)
      failed.push({ group: groupKey, skus: memberSkus, reason: `เปิดหน้ารายละเอียดไม่ได้: ${message}` })
      continue
    }
    log.done(`group ${groupIdx} parsed (1 PDP for ${members.length} SKU)`)

    const mirrorSku = resolveCardSku(members[0]!)
    const baseAssets = {
      image_urls: parsed.image_urls,
      image_url: parsed.image_url,
      description: parsed.description,
      key_features: parsed.key_features,
      features: parsed.features,
      specifications: parsed.specifications,
      faq_html: parsed.faq_html,
    }
    let mirroredAssets = baseAssets
    try {
      log.step(`group ${groupIdx} mirror images (shared, ref ${mirrorSku})`)
      const mirroredImages = await mirrorImportedProductImages(supabase, {
        batchId: batch.id,
        sku: mirrorSku,
        imageUrls: parsed.image_urls,
        referer: detailUrl,
        htmlFields: {
          description: parsed.description,
          key_features: parsed.key_features,
          features: parsed.features,
          specifications: parsed.specifications,
          faq_html: parsed.faq_html,
        },
      })
      log.done(`group ${groupIdx} mirror images`)

      log.step(`group ${groupIdx} mirror videos`)
      const mirroredVideos = await mirrorImportedProductVideos(supabase, {
        batchId: batch.id,
        sku: mirrorSku,
        htmlFields: {
          description: mirroredImages.description,
          key_features: mirroredImages.key_features,
          features: mirroredImages.features,
          specifications: mirroredImages.specifications,
          faq_html: mirroredImages.faq_html,
        },
      })
      log.done(`group ${groupIdx} mirror videos`)
      mirroredAssets = { ...mirroredImages, ...mirroredVideos }
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      log.warn(`group ${groupIdx} mirror failed — ใช้ URL เดิมจาก LG: ${message}`)
      mirroredAssets = baseAssets
    }

    for (const listCard of members) {
      const resolvedSku = resolveCardSku(listCard)
      if (!resolvedSku || !/^[A-Z0-9]{5,24}$/.test(resolvedSku)) {
        log.warn(`skip invalid sku=${resolvedSku || '?'}`)
        continue
      }
      const resolvedName = importDisplayName(parsed.name, listCard, resolvedSku)
      if (!resolvedName) {
        log.warn(`skip sku=${resolvedSku} — missing name`)
        continue
      }

      const cardCategorySlug = listCard.categorySlug?.trim().toLowerCase() || defaultCategorySlug
      const category = await resolveCategoryIdCached(supabase, cardCategorySlug, categoryCache)

      const { error } = await supabase
        .from('import_products')
        .upsert({
          batch_id: batch.id,
          source_url: detailUrl,
          category_id: category.id,
          name: resolvedName,
          sku: resolvedSku,
          headline: listCard.headline ?? parsed.headline,
          description: mirroredAssets.description,
          faq_html: mirroredAssets.faq_html,
          image_url: mirroredAssets.image_url,
          image_urls: mirroredAssets.image_urls,
          key_features: mirroredAssets.key_features,
          features: mirroredAssets.features,
          specifications: mirroredAssets.specifications,
          base_price: listCard.base_price ?? parsed.base_price ?? 0,
          full_price: listCard.full_price ?? parsed.full_price,
          price_range: null,
          subscription_note: listCard.subscription_note ?? null,
          purchase_only_label: listCard.purchase_only_label ?? null,
          purchase_only_url: listCard.purchase_only_url ?? null,
          discount_type: null,
          discount_value: null,
          service_self_clean: false,
          service_technician: false,
          service_months: null,
          installment_months: null,
          warranty_years: listCard.warranty_years ?? null,
          variant_group_key: listCard.variant_group_key ?? null,
          variant_label: listCard.variant_label ?? null,
          variant_sort: parseVariantSort(listCard.variant_label),
          sort_order: 0,
          is_active: true,
        }, { onConflict: 'batch_id,sku' })

      if (error) {
        log.error(`upsert failed sku=${resolvedSku}: ${error.message}`)
      }
      else {
        count += 1
        log.info(`upserted ${resolvedSku} variant=${listCard.variant_label ?? '-'} price=${listCard.base_price ?? '?'}`)
      }
    }
  }

  if (failed.length) {
    log.warn(`import finished with ${failed.length} failed group(s): ${failed.map(f => f.skus.join('/')).join(' | ')}`)
  }
  log.info(`import complete — ${count}/${toImport.length} saved batchId=${batch.id}`)
  return { count, batchId: batch.id, detailUrls, failed }
}
