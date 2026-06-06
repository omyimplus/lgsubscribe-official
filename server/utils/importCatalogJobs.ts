import type { CatalogScanResult } from '~~/server/utils/importCatalogScan'

export type CatalogJobStatus = 'queued' | 'running' | 'done' | 'error'

export type CatalogJob = {
  id: string
  lgSlug: string
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
  purgeOldJobs()
  const id = crypto.randomUUID()
  const job: CatalogJob = {
    id,
    lgSlug,
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
    job.message = 'กำลังเปิดหน้า LG และอ่านรายการสินค้า'
    try {
      job.result = await runner()
      job.status = 'done'
      job.message = `เสร็จ — ${job.result.totalOnLg} SKU`
    }
    catch (err: unknown) {
      job.status = 'error'
      if (err && typeof err === 'object' && 'statusMessage' in err) {
        const msg = (err as { statusMessage?: string }).statusMessage
        job.error = msg || 'ดึงรายการไม่สำเร็จ'
      }
      else {
        job.error = err instanceof Error ? err.message : 'ดึงรายการไม่สำเร็จ'
      }
      job.message = job.error
    }
    finally {
      job.finishedAt = new Date().toISOString()
    }
  })()

  return job
}
