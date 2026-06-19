import type { CatalogScanResult } from '~~/server/utils/importCatalogScan'

export type CatalogJobStatus = 'queued' | 'running' | 'done' | 'error'

export type CatalogJob = {
  id: string
  lgSlug: string | null
  listUrl: string | null
  categorySlug: string | null
  jobType: 'slug' | 'url'
  status: CatalogJobStatus
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  message: string | null
  result: CatalogScanResult | null
  error: string | null
}

const jobs = new Map<string, CatalogJob>()
const JOB_TTL_MS = 60 * 60 * 1000

const GENERIC_HTTP_PHRASES = new Set([
  'Bad Request',
  'Internal Server Error',
  'Service Unavailable',
  'Not Found',
])

/** H3 createError ใส่ข้อความใน message — statusMessage มักเป็น undefined */
function catalogJobErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as {
      message?: string
      statusMessage?: string
      data?: { message?: string }
    }
    const dataMsg = e.data?.message?.trim()
    if (dataMsg) return dataMsg

    const message = e.message?.trim()
    if (message && !GENERIC_HTTP_PHRASES.has(message)) return message

    const statusMessage = e.statusMessage?.trim()
    if (statusMessage && !GENERIC_HTTP_PHRASES.has(statusMessage)) return statusMessage

    if (message) return message
    if (statusMessage) return statusMessage
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim()
  return 'ดึงรายการไม่สำเร็จ'
}

function purgeOldJobs() {
  const cutoff = Date.now() - JOB_TTL_MS
  for (const [id, job] of jobs) {
    const finished = job.finishedAt ? Date.parse(job.finishedAt) : 0
    const created = Date.parse(job.createdAt)
    if ((job.status === 'done' || job.status === 'error') && finished < cutoff) {
      jobs.delete(id)
    }
    else if (job.status === 'queued' && created < cutoff) {
      jobs.delete(id)
    }
  }
}

export function getCatalogJob(jobId: string): CatalogJob | null {
  purgeOldJobs()
  return jobs.get(jobId) ?? null
}

export function startCatalogJob(
  lgSlug: string,
  runner: () => Promise<CatalogScanResult>,
): CatalogJob {
  return startImportScanJob({ jobType: 'slug', lgSlug, runner })
}

export function startUrlCatalogJob(
  listUrl: string,
  runner: () => Promise<CatalogScanResult>,
): CatalogJob {
  return startImportScanJob({ jobType: 'url', listUrl, runner })
}

function startImportScanJob(options: {
  jobType: 'slug' | 'url'
  lgSlug?: string
  listUrl?: string
  categorySlug?: string
  runner: () => Promise<CatalogScanResult>
}): CatalogJob {
  purgeOldJobs()
  const id = crypto.randomUUID()
  const job: CatalogJob = {
    id,
    lgSlug: options.lgSlug ?? null,
    listUrl: options.listUrl ?? null,
    categorySlug: options.categorySlug ?? null,
    jobType: options.jobType,
    status: 'queued',
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    message: 'รอคิว',
    result: null,
    error: null,
  }
  jobs.set(id, job)

  void (async () => {
    job.status = 'running'
    job.startedAt = new Date().toISOString()
    job.message = options.jobType === 'url'
      ? 'กำลังเปิด URL LG และอ่านรายการสินค้า'
      : 'กำลังเปิดหน้า LG และอ่านรายการสินค้า'
    try {
      job.result = await options.runner()
      job.status = 'done'
      job.message = `เสร็จ — ${job.result.totalOnLg} SKU`
    }
    catch (err: unknown) {
      job.status = 'error'
      job.error = catalogJobErrorMessage(err)
      job.message = job.error
      console.error(`[import-catalog-job] ${job.id} failed:`, err)
    }
    finally {
      job.finishedAt = new Date().toISOString()
    }
  })()

  return job
}
