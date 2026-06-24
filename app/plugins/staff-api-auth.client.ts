const PUBLIC_API_PREFIXES = [
  '/api/public/',
  '/api/auth/',
  '/api/line/',
  '/api/me/',
]

function shouldAttachStaffAuth(url: string): boolean {
  let path = url
  try {
    path = new URL(url, 'http://localhost').pathname
  }
  catch {
    /* relative path */
  }
  if (!path.startsWith('/api/')) return false
  if (PUBLIC_API_PREFIXES.some(prefix => path.startsWith(prefix))) return false
  return true
}

export default defineNuxtPlugin({
  name: 'staff-api-auth',
  dependsOn: ['supabase'],
  setup() {
    const authFetch = $fetch.create({
      async onRequest({ request, options }) {
        const raw = typeof request === 'string' ? request : request.toString()
        if (!shouldAttachStaffAuth(raw)) return

        const supabase = useNuxtApp().$supabase
        if (!supabase) return

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const headers = new Headers(options.headers as HeadersInit)
        headers.set('Authorization', `Bearer ${session.access_token}`)

        if (options.body instanceof FormData) {
          headers.delete('content-type')
        }

        options.headers = headers
      },
    })

    globalThis.$fetch = authFetch
  },
})
