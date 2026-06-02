import {
  hasLineAccessToken,
  sendLineReply,
  verifyLineWebhookSignature,
} from '~~/server/utils/lineMessaging'

const WELCOME_TEXT = 'ยินดีต้อนรับ LG Subscribe — ระบบจะแจ้งทีมงานเมื่อมีลูกค้าส่งคำขอสนใจผ่อนผ่านเว็บไซต์'
const AUTO_REPLY_TEXT = 'ขอบคุณที่ติดต่อ LG Subscribe ทีมงานจะตอบกลับโดยเร็วที่สุดในช่วงเวลาทำการ'

type LineWebhookBody = {
  events?: LineEvent[]
}

type LineEvent = {
  type: string
  replyToken?: string
  source?: { userId?: string, type?: string }
  message?: { type?: string, text?: string }
}

export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event, 'utf8')
  const bodyText = rawBody ?? ''

  const config = useRuntimeConfig()
  const secret = String(config.lineChannelSecret ?? '').trim()
  const signature = getHeader(event, 'x-line-signature') ?? ''

  if (secret) {
    if (!signature || !verifyLineWebhookSignature(bodyText, signature, secret)) {
      throw createError({ statusCode: 401, message: 'Invalid Line signature' })
    }
  }

  let payload: LineWebhookBody = {}
  try {
    payload = bodyText ? JSON.parse(bodyText) as LineWebhookBody : {}
  }
  catch {
    console.warn('[line] webhook: invalid JSON body')
    return { ok: true }
  }

  const canReply = hasLineAccessToken()
  for (const ev of payload.events ?? []) {
    const userId = ev.source?.userId
    if (userId) {
      console.info('[line] webhook event', ev.type, userId)
    }

    if (!canReply || !ev.replyToken) continue

    if (ev.type === 'follow') {
      await sendLineReply(ev.replyToken, WELCOME_TEXT)
    }
    else if (ev.type === 'message' && ev.message?.type === 'text') {
      await sendLineReply(ev.replyToken, AUTO_REPLY_TEXT)
    }
  }

  return { ok: true }
})
