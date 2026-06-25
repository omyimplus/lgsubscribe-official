import {
  hasLineAccessToken,
  sendLineReply,
  verifyLineWebhookSignature,
} from '~~/server/utils/lineMessaging'

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
    if (!userId || !ev.replyToken) continue

    if (userId) {
      console.info('[line] webhook event', ev.type, userId)
    }

    if (!canReply) continue

    if (ev.type === 'follow') {
      await sendLineReply(
        ev.replyToken,
        [
          'เชื่อม LG Subscribe สำเร็จ',
          'User ID ของคุณ:',
          userId,
          '',
          'นำไปใส่ใน NUXT_LINE_NOTIFY_USER_ID',
        ].join('\n'),
      )
      continue
    }

    if (ev.type === 'message' && ev.message?.type === 'text') {
      const text = ev.message.text?.trim().toLowerCase() ?? ''
      if (text === 'id' || text === 'ทดสอบ' || text === 'test') {
        await sendLineReply(
          ev.replyToken,
          [
            'LG Subscribe setup',
            `NUXT_LINE_NOTIFY_USER_ID=${userId}`,
          ].join('\n'),
        )
      }
    }
  }

  return { ok: true }
})
