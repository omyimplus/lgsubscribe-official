const EMAIL_API_BASE = 'https://email-api.thaibulksms.com'

type ThaibulkConfig = {
  apiKey: string
  apiSecret: string
  fromEmail: string
  fromName: string
  templateUuid: string
}

function getThaibulkConfig(): ThaibulkConfig | null {
  const config = useRuntimeConfig()
  const apiKey = String(config.thaibulkEmailApiKey ?? '').trim()
  const apiSecret = String(config.thaibulkEmailApiSecret ?? '').trim()
  const fromEmail = String(config.thaibulkEmailFrom ?? '').trim()
  const templateUuid = String(config.thaibulkEmailTemplateUuid ?? '').trim()
  if (!apiKey || !apiSecret || !fromEmail || !templateUuid) return null
  return {
    apiKey,
    apiSecret,
    fromEmail,
    fromName: String(config.thaibulkEmailFromName ?? 'LG Subscribe').trim() || 'LG Subscribe',
    templateUuid,
  }
}

export function isThaibulkEmailConfigured() {
  return getThaibulkConfig() !== null
}

function authHeader(apiKey: string, apiSecret: string) {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
}

async function thaibulkRequest<T>(
  path: string,
  init: RequestInit,
  cfg: ThaibulkConfig,
): Promise<T> {
  const resp = await fetch(`${EMAIL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(cfg.apiKey, cfg.apiSecret),
      Accept: 'application/json',
      ...init.headers,
    },
  })

  const text = await resp.text()
  let body: unknown = text
  try {
    body = text ? JSON.parse(text) : null
  }
  catch {
    // keep raw text
  }

  if (!resp.ok) {
    const message = typeof body === 'object' && body && 'message' in body
      ? String((body as { message: unknown }).message)
      : text || `HTTP ${resp.status}`
    throw createError({ statusCode: 502, message: `ThaiBulkSMS Email: ${message}` })
  }

  return body as T
}

async function uploadAttachment(
  cfg: ThaibulkConfig,
  file: { filename: string, content: Buffer, contentType?: string },
): Promise<string> {
  const form = new FormData()
  const blob = new Blob([file.content], { type: file.contentType ?? 'application/pdf' })
  form.append('file', blob, file.filename)

  const result = await thaibulkRequest<{ uuid?: string }>(
    '/email/v1/email-attachment',
    { method: 'POST', body: form },
    cfg,
  )

  const uuid = result?.uuid?.trim()
  if (!uuid) {
    throw createError({ statusCode: 502, message: 'ThaiBulkSMS Email: อัปโหลดไฟล์แนบไม่สำเร็จ' })
  }
  return uuid
}

export async function sendThaibulkTemplateEmail(options: {
  to: string
  subject: string
  payload?: Record<string, string>
  attachments?: Array<{ filename: string, content: Buffer, contentType?: string }>
}) {
  const cfg = getThaibulkConfig()
  if (!cfg) {
    throw createError({ statusCode: 503, message: 'ระบบส่งอีเมลยังไม่ได้ตั้งค่า' })
  }

  const attachmentUuids: string[] = []
  for (const att of options.attachments ?? []) {
    attachmentUuids.push(await uploadAttachment(cfg, att))
  }

  await thaibulkRequest(
    '/email/v1/send_template',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mail_from: { email: cfg.fromEmail, name: cfg.fromName },
        mail_to: { email: options.to },
        subject: options.subject,
        template_uuid: cfg.templateUuid,
        ...(options.payload ? { payload: options.payload } : {}),
        ...(attachmentUuids.length ? { attachment_uuids: attachmentUuids } : {}),
      }),
    },
    cfg,
  )
}

export async function checkThaibulkEmailCredit() {
  const cfg = getThaibulkConfig()
  if (!cfg) return null
  return thaibulkRequest<Record<string, unknown>>('/email/v1/credit', { method: 'GET' }, cfg)
}
