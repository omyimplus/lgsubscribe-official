import { runImportCatalogScan } from '~~/server/utils/importCatalogScan'
import { startCatalogJob } from '~~/server/utils/importCatalogJobs'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ lgSlug?: string }>(event).catch(() => ({}))
  const lgSlug = String(body?.lgSlug ?? 'tvs').trim().toLowerCase()
  const supabase = useSupabaseAdmin()

  const job = startCatalogJob(lgSlug, () => runImportCatalogScan(supabase, lgSlug))

  return {
    jobId: job.id,
    lgSlug: job.lgSlug,
    status: job.status,
  }
})
