import {
  getLineWebhookUrl,
  hasLineAccessToken,
  hasLineChannelSecret,
  isLineConfigured,
  parseNotifyUserIds,
} from '~~/server/utils/lineMessaging'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  return {
    configured: isLineConfigured(),
    lineOaUrl: String(config.public.lineOaUrl ?? '').trim(),
    channelId: String(config.lineChannelId ?? '').trim(),
    webhookUrl: getLineWebhookUrl(event),
    notifyUserCount: parseNotifyUserIds().length,
    hasChannelSecret: hasLineChannelSecret(),
    hasAccessToken: hasLineAccessToken(),
    hasNotifyUserIds: parseNotifyUserIds().length > 0,
  }
})
