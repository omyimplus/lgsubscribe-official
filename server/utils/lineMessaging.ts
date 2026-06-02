import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push'
const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply'

function getLineRuntime() {
  return useRuntimeConfig()
}

export function parseNotifyUserIds(raw?: string): string[] {
  const value = (raw ?? getLineRuntime().lineNotifyUserIds ?? '').trim()
  if (!value) return []
  return [...new Set(value.split(',').map(id => id.trim()).filter(Boolean))]
}

export function isLineConfigured(): boolean {
  const config = getLineRuntime()
  const token = String(config.lineChannelAccessToken ?? '').trim()
  return Boolean(token) && parseNotifyUserIds().length > 0
}

export function hasLineAccessToken(): boolean {
  return Boolean(String(getLineRuntime().lineChannelAccessToken ?? '').trim())
}

export function hasLineChannelSecret(): boolean {
  return Boolean(String(getLineRuntime().lineChannelSecret ?? '').trim())
}

export function getLineWebhookUrl(event: H3Event): string {
  const url = getRequestURL(event)
  return `${url.origin}/api/line/webhook`
}

export function verifyLineWebhookSignature(body: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false
  const digest = createHmac('sha256', secret).update(body).digest('base64')
  try {
    const a = Buffer.from(digest)
    const b = Buffer.from(signature)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  }
  catch {
    return false
  }
}

export type LinePushResult = {
  ok: boolean
  sentTo?: number
  error?: string
}

export async function sendLinePush(userIds: string[], text: string): Promise<LinePushResult> {
  const token = String(getLineRuntime().lineChannelAccessToken ?? '').trim()
  const ids = userIds.filter(Boolean)
  if (!token || !ids.length) {
    return { ok: false, error: 'Line push ไม่ได้ตั้งค่า (token หรือ user ids)' }
  }

  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: ids,
        messages: [{ type: 'text', text }],
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[line] push failed', res.status, detail)
      return { ok: false, error: `Line API ${res.status}` }
    }

    return { ok: true, sentTo: ids.length }
  }
  catch (err) {
    console.error('[line] push error', err)
    return { ok: false, error: err instanceof Error ? err.message : 'push failed' }
  }
}

export async function sendLineReply(replyToken: string, text: string): Promise<void> {
  const token = String(getLineRuntime().lineChannelAccessToken ?? '').trim()
  if (!token || !replyToken) return

  try {
    const res = await fetch(LINE_REPLY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text }],
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[line] reply failed', res.status, detail)
    }
  }
  catch (err) {
    console.error('[line] reply error', err)
  }
}
