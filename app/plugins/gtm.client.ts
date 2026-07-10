import { isLineOaHref, isPhoneHref } from '~~/shared/utils/gtmEvents'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

function isAdminPath(path: string) {
  return path === '/admin' || path.startsWith('/admin/')
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const gtmId = String(config.public.gtmId ?? '').trim()
  if (!gtmId) return

  const { trackLineClick, trackPhoneClick } = useGtmEvent()
  const router = useRouter()

  router.afterEach((to) => {
    if (isAdminPath(to.path)) return
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'nuxt_route',
      page_path: to.fullPath,
      page_title: document.title,
    })
  })

  document.addEventListener('click', (event) => {
    const route = router.currentRoute.value
    if (isAdminPath(route.path)) return

    const target = event.target
    if (!(target instanceof Element)) return

    const anchor = target.closest('a[href]')
    if (!(anchor instanceof HTMLAnchorElement)) return

    const href = anchor.href
    if (!href) return

    const label = anchor.getAttribute('aria-label')
      || anchor.textContent?.trim()
      || undefined

    if (isLineOaHref(href)) {
      trackLineClick({ href, label })
      return
    }

    if (isPhoneHref(href)) {
      trackPhoneClick({ href, label })
    }
  }, true)
})
