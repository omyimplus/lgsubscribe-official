import { getCatalogJob } from '~~/server/utils/importCatalogJobs'

export default defineEventHandler((event) => {
  const jobId = getRouterParam(event, 'jobId')
  if (!jobId) {
    throw createError({ statusCode: 400, message: 'ต้องระบุ jobId' })
  }

  const job = getCatalogJob(jobId)
  if (!job) {
    throw createError({ statusCode: 404, message: 'ไม่พบงานดึงรายการ (หมดอายุหรือรีสตาร์ทเซิร์ฟเวอร์แล้ว)' })
  }

  return {
    jobId: job.id,
    lgSlug: job.lgSlug,
    status: job.status,
    message: job.message,
    error: job.error,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    result: job.status === 'done' ? job.result : null,
  }
})
