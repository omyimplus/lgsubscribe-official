import {
  getLineWebhookUrl,
  hasLineAccessToken,
  hasLineChannelSecret,
  isLineConfigured,
  parseNotifyUserIds,
} from '~~/server/utils/lineMessaging'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  return {
    configured: isLineConfigured(),
    lineOaUrl: String(config.public.lineOaUrl ?? '').trim(),
    webhookUrl: getLineWebhookUrl(event),
    notifyUserCount: parseNotifyUserIds().length,
    hasChannelSecret: hasLineChannelSecret(),
    hasAccessToken: hasLineAccessToken(),
  }
})
