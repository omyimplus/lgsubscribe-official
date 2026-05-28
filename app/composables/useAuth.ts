export function useAuth() {
  const { $supabase } = useNuxtApp()
  const router = useRouter()
  type AppRole = 'admin' | 'employee' | 'customer'

  async function signIn(email: string, password: string) {
    const { data, error } = await $supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await $supabase.auth.signOut()
    await router.push('/admin/login')
  }

  async function getSession() {
    const { data } = await $supabase.auth.getSession()
    return data.session
  }

  async function getUser() {
    const { data } = await $supabase.auth.getUser()
    return data.user
  }

  async function getRole(): Promise<AppRole> {
    const user = await getUser()
    const rawRole = user?.user_metadata?.role ?? user?.app_metadata?.role
    const role = typeof rawRole === 'string' ? rawRole.trim().toLowerCase() : ''
    if (role === 'admin') return 'admin'
    if (role === 'employee') return 'employee'
    return 'customer'
  }

  return { signIn, signOut, getSession, getUser, getRole }
}
