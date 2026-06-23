import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'

export function getPublicSiteUrl(event?: H3Event): string {
  const configured = String(useRuntimeConfig().public.siteUrl || '').replace(/\/$/, '')
  if (configured) return configured
  if (!event) return ''
  const url = getRequestURL(event)
  return `${url.protocol}//${url.host}`
}
