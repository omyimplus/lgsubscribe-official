import { COOKIE_CONSENT_STORAGE_KEY } from '~~/shared/utils/cookieConsent'

export function useCookieConsent() {
  const visible = ref(false)

  function hasConsent() {
    if (!import.meta.client) return false
    return localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === 'accepted'
  }

  function accept() {
    if (!import.meta.client) return
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'accepted')
    visible.value = false
  }

  onMounted(() => {
    visible.value = !hasConsent()
  })

  return { visible, accept }
}
