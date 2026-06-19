import { normalizeLgCategoryListUrl } from '~~/server/utils/lgCategoryUrl'
import { runImportCatalogScanFromUrl } from '~~/server/utils/importCatalogScan'
import { startUrlCatalogJob } from '~~/server/utils/importCatalogJobs'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ listUrl?: string }>(event).catch(() => ({}))
  const listUrl = normalizeLgCategoryListUrl(String(body?.listUrl ?? ''))

  const supabase = useSupabaseAdmin()
  const job = startUrlCatalogJob(listUrl, () =>
    runImportCatalogScanFromUrl(supabase, listUrl),
  )

  return {
    jobId: job.id,
    listUrl: job.listUrl,
    status: job.status,
  }
})
