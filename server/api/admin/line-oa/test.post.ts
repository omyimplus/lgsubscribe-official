import { isLineConfigured, parseNotifyUserIds, sendLinePush } from '~~/server/utils/lineMessaging'

const TEST_MESSAGE = 'ทดสอบ LG Subscribe Line OA'

export default defineEventHandler(async () => {
  if (!isLineConfigured()) {
    throw createError({
      statusCode: 400,
      message: 'ยังไม่ได้ตั้งค่า Line — ต้องมี Channel Access Token และ LINE_NOTIFY_USER_IDS อย่างน้อย 1 คน',
    })
  }

  const result = await sendLinePush(parseNotifyUserIds(), TEST_MESSAGE)
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
