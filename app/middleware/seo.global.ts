import { SITE_NOINDEX_PREFIXES } from '~~/shared/utils/siteSeo'

export default defineNuxtRouteMiddleware((to) => {
  const isPrivate = SITE_NOINDEX_PREFIXES.some(
    prefix => to.path === prefix || to.path.startsWith(`${prefix}/`),
  )
  if (!isPrivate) return

  useSeoMeta({ robots: 'noindex, nofollow' })
  useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
})
