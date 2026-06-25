import { isLineConfigured, sendLinePushToStaff } from '~~/server/utils/lineMessaging'

const TEST_MESSAGE = 'ทดสอบ LG Subscribe Line OA'

export default defineEventHandler(async () => {
  if (!isLineConfigured()) {
    throw createError({
      statusCode: 400,
      message: 'ยังไม่พร้อม — ต้องมี NUXT_LINE_CHANNEL_ACCESS_TOKEN และ NUXT_LINE_NOTIFY_USER_ID',
    })
  }

  const result = await sendLinePushToStaff(TEST_MESSAGE)
  if (!result.ok) {
    throw createError({
      statusCode: 502,
      message: result.error ?? 'ส่งข้อความทดสอบไม่สำเร็จ',
    })
  }

  return {
    ok: true,
    message: TEST_MESSAGE,
    sentTo: result.sentTo ?? 0,
  }
})
