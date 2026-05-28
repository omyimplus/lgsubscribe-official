export default defineNuxtRouteMiddleware(async () => {
  // ทำงานเฉพาะ client-side เพราะ Supabase session อยู่ใน browser
  if (import.meta.server) return

  const { getSession, getRole } = useAuth()
  const session = await getSession()

  if (!session) {
    return navigateTo('/admin/login')
  }

  const role = await getRole()
  if (role !== 'admin' && role !== 'employee') {
    return navigateTo('/')
  }
})
