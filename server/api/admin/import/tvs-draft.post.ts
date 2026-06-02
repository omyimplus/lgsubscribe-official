import {
  cardsFromClientItems,
  fetchTvListCards,
  filterListCards,
  importTvCardsToDraft,
  resolveImportSource,
  type ClientCatalogItem,
} from '~~/server/utils/importTvDraft'
import { createImportLogger, resetImportLogClock } from '~~/server/utils/lgImportLog'

export default defineEventHandler(async (event) => {
  resetImportLogClock()
  const log = createImportLogger('import-draft')

  const body = await readBody<{
    skus?: string[]
    importAll?: boolean
    testLimit?: number
    items?: ClientCatalogItem[]
    lgSlug?: string
    categorySlug?: string
  }>(event).catch(() => ({}))

  const source = resolveImportSource(body?.lgSlug ?? body?.categorySlug ?? 'tvs')
  log.info(
    `start ${source.lgSlug} importAll=${Boolean(body?.importAll)} skus=${body?.skus?.length ?? 0} items=${body?.items?.length ?? 0}`,
  )

  const supabase = useSupabaseAdmin()

  let selected
  if (body?.items?.length) {
    selected = cardsFromClientItems(body.items)
    log.info(`using ${selected.length} pre-scraped item(s) from client (no PLP re-scrape)`)
  }
  else {
    log.step(`fetch PLP cards (${source.lgSlug})`)
    const listCards = await fetchTvListCards(500, {
      listUrl: source.listUrl,
      lgSlug: source.lgSlug,
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'เปิดหน้าจอไม่ขึ้น'
      log.error(`fetch PLP failed: ${message}`)
      throw createError({ statusCode: 503, message })
    })
    log.done(`fetch PLP cards (${listCards.length} total)`)

    selected = filterListCards(listCards, {
      skus: body?.skus,
      importAll: body?.importAll,
      testLimit: body?.testLimit ?? 3,
    })
    log.info(`selected ${selected.length} card(s) from ${listCards.length} PLP row(s)`)
  }

  if (!selected.length) {
    throw createError({ statusCode: 400, message: 'ไม่พบรายการที่เลือกจาก LG' })
  }

  const note = body?.importAll
    ? `${source.label} import all (${selected.length})`
    : body?.skus?.length
      ? `${source.label} import selected (${selected.length})`
      : `${source.label} import test (${selected.length})`

  log.step('import cards to draft')
  const result = await importTvCardsToDraft(supabase, selected, {
    batchNote: note,
    categorySlug: source.categorySlug,
  })
  log.done(`import cards to draft (${result.count} saved)`)
  log.info(`done count=${result.count} batchId=${result.batchId} lgSlug=${source.lgSlug}`)

  return { ...result, lgSlug: source.lgSlug, categorySlug: source.categorySlug }
})
