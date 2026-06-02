import type { User } from '@supabase/supabase-js'
import type { CustomerProfile } from '~~/shared/types/customer'

export function useCustomerSession() {
  const { $supabase } = useNuxtApp()
  const router = useRouter()

  const user = useState<User | null>('customer-session-user', () => null)
  const profile = useState<CustomerProfile | null>('customer-session-profile', () => null)
  const ready = useState('customer-session-ready', () => false)
  const initialized = useState('customer-session-init', () => false)

  const isLoggedIn = computed(() => !!user.value)

  const displayName = computed(() => {
    const name = profile.value?.full_name?.trim()
    if (name) return name
    const email = user.value?.email?.trim()
    if (email) return email.split('@')[0] ?? email
    return 'สมาชิก'
  })

  async function refresh() {
    if (!import.meta.client) return

    const { data: { session } } = await $supabase.auth.getSession()
    user.value = session?.user ?? null
    profile.value = null

    if (session?.access_token) {
      try {
        profile.value = await $fetch<CustomerProfile>('/api/me/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
      }
      catch {
        /* guest session หมดอายุ หรือไม่ใช่ customer profile */
      }
    }

    ready.value = true
  }

  async function signOut() {
    await $supabase.auth.signOut()
    user.value = null
    profile.value = null
    await router.push('/')
  }

  function init() {
    if (!import.meta.client || initialized.value) return
    initialized.value = true
    refresh()
    $supabase.auth.onAuthStateChange(() => {
      refresh()
    })
  }

  init()

  return {
    user,
    profile,
    ready,
    isLoggedIn,
    displayName,
    refresh,
    signOut,
  }
}
