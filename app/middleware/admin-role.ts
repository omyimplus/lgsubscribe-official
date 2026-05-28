export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { getSession, getRole } = useAuth()
  const session = await getSession()

  if (!session) {
    return navigateTo('/admin/login')
  }

  const role = await getRole()
  if (role !== 'admin') {
    return navigateTo('/admin')
  }
})
