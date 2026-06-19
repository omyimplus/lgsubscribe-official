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
    listUrl?: string
    perItemCategory?: boolean
  }>(event).catch(() => ({}))

  const hasClientItems = Boolean(body?.items?.length)
  const explicitCategory = body?.categorySlug?.trim().toLowerCase()

  let categorySlug: string
  let sourceLabel: string

  if (hasClientItems && explicitCategory) {
    categorySlug = explicitCategory
    sourceLabel = body?.listUrl?.trim()
      ? `URL ${body.listUrl.trim()}`
      : explicitCategory
  }
  else {
    const source = resolveImportSource(body?.lgSlug ?? body?.categorySlug ?? 'tvs')
    categorySlug = explicitCategory || source.categorySlug
    sourceLabel = source.label
  }

  log.info(
    `start ${sourceLabel} importAll=${Boolean(body?.importAll)} skus=${body?.skus?.length ?? 0} items=${body?.items?.length ?? 0}`,
  )

  const supabase = useSupabaseAdmin()

  let selected
  if (body?.items?.length) {
    if (body.perItemCategory) {
      const missing = body.items.filter(item => !item.categorySlug?.trim())
      if (missing.length) {
        throw createError({
          statusCode: 400,
          message: `กรุณาระบุหมวดให้ครบทุกรายการ (${missing.length} รายการยังไม่มี categorySlug)`,
        })
      }
    }
    selected = cardsFromClientItems(body.items)
    log.info(`using ${selected.length} pre-scraped item(s) from client (no PLP re-scrape)`)
  }
  else {
    log.step(`fetch PLP cards (${sourceLabel})`)
    const listSource = body?.listUrl?.trim()
      ? { listUrl: body.listUrl.trim(), lgSlug: body.lgSlug ?? 'url-import' }
      : resolveImportSource(body?.lgSlug ?? categorySlug)
    const listCards = await fetchTvListCards(500, {
      listUrl: listSource.listUrl,
      lgSlug: listSource.lgSlug,
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

  const note = body?.listUrl?.trim()
    ? `${body.listUrl.trim()} import selected (${selected.length})`
    : body?.importAll
      ? `${sourceLabel} import all (${selected.length})`
      : body?.skus?.length
        ? `${sourceLabel} import selected (${selected.length})`
        : `${sourceLabel} import test (${selected.length})`

  log.step('import cards to draft')
  const result = await importTvCardsToDraft(supabase, selected, {
    batchNote: note,
    categorySlug,
  })
  log.done(`import cards to draft (${result.count} saved)`)
  log.info(`done count=${result.count} batchId=${result.batchId} category=${categorySlug}`)

  return { ...result, categorySlug, listUrl: body?.listUrl ?? null }
})
