export type ImportItemDetail = {
  id: string
  batch_id: string
  source_url: string | null
  category_id: string
  name: string
  sku: string
  headline: string | null
  description: string | null
  faq_html: string | null
  image_url: string | null
  image_urls: string[]
  key_features: string | null
  features: string | null
  specifications: string | null
  base_price: number
  full_price: number | null
  price_range: string | null
  subscription_note: string | null
  purchase_only_label: string | null
  purchase_only_url: string | null
  service_self_clean: boolean
  service_technician: boolean
  service_months: number | null
  installment_months: number | null
  warranty_years: number | null
}

export type ImportItemDetailField = 'key_features' | 'features' | 'specifications' | 'faq_html'

export function useAdminImportItemForm(itemId: string) {
  const { data: item, pending: loadingItem, error: fetchError, refresh } = useFetch<ImportItemDetail>(
    () => `/api/admin/import/items/${itemId}`,
    {
      key: `admin-import-item-${itemId}`,
      watch: [() => itemId],
      // session อยู่ฝั่ง browser — หลีกเลี่ยง SSR ที่ไม่มี cookie
      server: false,
    },
  )

  const form = reactive<Record<ImportItemDetailField, string>>({
    key_features: '',
    features: '',
    specifications: '',
    faq_html: '',
  })

  const saving = ref(false)
  const formError = ref('')

  watch(item, (value) => {
    if (!value) return
    form.key_features = value.key_features ?? ''
    form.features = value.features ?? ''
    form.specifications = value.specifications ?? ''
    form.faq_html = value.faq_html ?? ''
  }, { immediate: true })

  async function saveSingleDetailField(field: ImportItemDetailField) {
    saving.value = true
    formError.value = ''
    try {
      const updated = await $fetch<ImportItemDetail>(`/api/admin/import/items/${itemId}`, {
        method: 'PATCH',
        body: { [field]: form[field] || null },
      })
      item.value = updated
      return true
    }
    catch (err: any) {
      formError.value = err?.data?.message ?? err?.message ?? 'บันทึกไม่สำเร็จ'
      return false
    }
    finally {
      saving.value = false
    }
  }

  return {
    item,
    loadingItem,
    fetchError,
    refresh,
    form,
    saving,
    formError,
    saveSingleDetailField,
  }
}
