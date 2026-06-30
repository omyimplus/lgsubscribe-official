import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'
import { SITE_CANONICAL_URL } from '~~/shared/utils/siteContact'

export function getPublicSiteUrl(event?: H3Event): string {
  const configured = String(useRuntimeConfig().public.siteUrl || '').replace(/\/$/, '')
  if (configured) return configured
  if (event) {
    const url = getRequestURL(event)
    return `${url.protocol}//${url.host}`
  }
  return SITE_CANONICAL_URL
}
