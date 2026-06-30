import type { InquiryItem } from '~~/shared/types/inquiry'
import type { ComboCustomerSegment } from '~~/shared/types/comboProgram'

export function useCartInstallmentSchedulePdf() {
  const { $supabase } = useNuxtApp()
  const combo = useComboCart()
  const { getRole } = useAuth()

  const isAdmin = ref(false)
  const roleReady = ref(false)

  onMounted(async () => {
    const role = await getRole()
    isAdmin.value = role === 'admin'
    roleReady.value = true
  })

  async function authHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await $supabase.auth.getSession()
    if (!session?.access_token) return {}
    return { Authorization: `Bearer ${session.access_token}` }
  }

  async function isAdminUser() {
    const role = await getRole()
    return role === 'admin'
  }

  async function downloadPdf(items: InquiryItem[]) {
    const headers = await authHeaders()
    const blob = await $fetch<Blob>('/api/public/cart-installment-schedule-pdf', {
      method: 'POST',
      headers: {
        ...headers,
        Accept: 'application/pdf',
      },
      body: {
        items,
        combo_customer_segment: combo.segment.value,
      },
      responseType: 'blob',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ตารางผ่อน.pdf'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function requestPdfByEmail(items: InquiryItem[], email: string) {
    const headers = await authHeaders()
    return $fetch<{ ok: boolean, message: string }>('/api/public/cart-installment-schedule-pdf', {
      method: 'POST',
      headers,
      body: {
        email: email.trim(),
        items,
        combo_customer_segment: combo.segment.value as ComboCustomerSegment,
      },
    })
  }

  return {
    isAdmin,
    roleReady,
    isAdminUser,
    downloadPdf,
    requestPdfByEmail,
  }
}
