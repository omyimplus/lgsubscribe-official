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
})
