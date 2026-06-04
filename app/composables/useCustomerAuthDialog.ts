export type CustomerAuthTab = 'login' | 'register'

export function useCustomerAuthDialog() {
  const open = useState('customer-auth-dialog-open', () => false)
  const tab = useState<CustomerAuthTab>('customer-auth-dialog-tab', () => 'login')
  const redirectTo = useState<string | null>('customer-auth-dialog-redirect', () => null)

  function openAuthDialog(options?: { tab?: CustomerAuthTab, redirect?: string }) {
    tab.value = options?.tab ?? 'login'
    redirectTo.value = options?.redirect?.trim() || null
    open.value = true
  }

  function closeAuthDialog() {
    open.value = false
    redirectTo.value = null
  }

  function setTab(next: CustomerAuthTab) {
    tab.value = next
  }

  return {
    open,
    tab,
    redirectTo,
    openAuthDialog,
    closeAuthDialog,
    setTab,
  }
}
