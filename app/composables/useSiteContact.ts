import {
  SITE_BUSINESS_HOURS,
  SITE_FACEBOOK_URL,
  SITE_LINE_QR_IMAGE,
  SITE_OFFICE_ADDRESS,
  SITE_PHONES,
  SITE_PHONES_DISPLAY,
  SITE_SOCIAL_LINKS,
  SITE_TIKTOK_HANDLE,
  SITE_TIKTOK_URL,
} from '~~/shared/utils/siteContact'

export function useSiteContact() {
  const config = useRuntimeConfig()
  const { lineOaUrl, lineOaIdDisplay } = useLineOa()

  const lineQrImage = computed(() =>
    String(config.public.lineOaQrImage || '').trim() || SITE_LINE_QR_IMAGE,
  )

  const socialLinks = computed(() => [
    ...SITE_SOCIAL_LINKS,
    ...(lineOaUrl.value
      ? [{ label: 'Line', href: lineOaUrl.value, icon: 'mdi:chat' }]
      : []),
  ])

  return {
    phones: SITE_PHONES,
    phonesDisplay: SITE_PHONES_DISPLAY,
    businessHours: SITE_BUSINESS_HOURS,
    officeAddress: SITE_OFFICE_ADDRESS,
    lineOaUrl,
    lineOaIdDisplay,
    lineQrImage,
    facebookUrl: SITE_FACEBOOK_URL,
    tiktokUrl: SITE_TIKTOK_URL,
    tiktokHandle: SITE_TIKTOK_HANDLE,
    socialLinks,
  }
}
