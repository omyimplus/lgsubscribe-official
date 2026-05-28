import type { Category } from '~~/shared/types/category'
import type { Product, ProductInput } from '~~/shared/types/product'
import type { Tag } from '~~/shared/types/tag'

export function useAdminProductForm(productId?: string) {
  const router = useRouter()
  const isEdit = computed(() => !!productId)

  const { data: categories } = useFetch<Category[]>('/api/categories', { default: () => [] })
  const { data: mainCategories } = useFetch<import('~~/shared/types/main-category').MainCategory[]>('/api/main-categories', { default: () => [] })
  const { data: allTags } = useFetch<Tag[]>('/api/tags', { default: () => [] })

  const { data: product, pending: loadingProduct } = useFetch<Product>(
    () => (productId ? `/api/products/${productId}` : ''),
    {
      key: `admin-product-${productId ?? 'new'}`,
      immediate: !!productId,
      watch: [() => productId],
    },
  )

  const form = reactive<ProductInput & { tag_ids: string[] }>({
    category_id: '',
    name: '',
    sku: '',
    headline: '',
    description: '',
    faq_html: '',
    key_features: '',
    features: '',
    specifications: '',
    image_url: '',
    image_urls: [],
    base_price: 0,
    full_price: null,
    price_range: '',
    subscription_note: '',
    purchase_only_label: '',
    purchase_only_url: '',
    discount_type: null,
    discount_value: null,
    service_self_clean: false,
    service_technician: false,
    service_months: null,
    installment_months: null,
    warranty_years: null,
    status: 'draft',
    sort_order: 0,
    is_active: true,
    tag_ids: [],
  })

  const saving = ref(false)
  const formError = ref('')
  const uploadingImage = ref(false)
  const dragOverImageZone = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)

  const inputClass =
    'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10'
  const btnSecondaryClass =
    'inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50'

  const pricingPreview = useProductPricing(
    computed(() => form.base_price),
    computed(() => form.discount_type),
    computed(() => form.discount_value),
  )

  function categoriesForMain(mainId: string) {
    return (categories.value ?? []).filter(c => c.main_category_id === mainId)
  }

  watch(product, (p) => {
    if (!p) return
    form.category_id = p.category_id
    form.name = p.name
    form.sku = p.sku
    form.headline = p.headline ?? ''
    form.description = p.description ?? ''
    form.faq_html = p.faq_html ?? ''
    form.key_features = p.key_features ?? ''
    form.features = p.features ?? ''
    form.specifications = p.specifications ?? ''
    form.image_url = p.image_url ?? ''
    form.image_urls = p.image_urls?.length
      ? [...p.image_urls]
      : (p.image_url ? [p.image_url] : [])
    form.base_price = Number(p.base_price)
    form.full_price = p.full_price != null ? Number(p.full_price) : null
    form.price_range = p.price_range ?? ''
    form.subscription_note = p.subscription_note ?? ''
    form.purchase_only_label = p.purchase_only_label ?? ''
    form.purchase_only_url = p.purchase_only_url ?? ''
    form.discount_type = p.discount_type
    form.discount_value = p.discount_value != null ? Number(p.discount_value) : null
    form.service_self_clean = p.service_self_clean
    form.service_technician = p.service_technician
    form.service_months = p.service_months
    form.installment_months = p.installment_months
    form.warranty_years = p.warranty_years
    form.status = p.status
    form.sort_order = p.sort_order
    form.is_active = p.is_active
    form.tag_ids = p.tags?.map(t => t.id) ?? []
  }, { immediate: true })

  watch(categories, (list) => {
    if (!isEdit.value && list?.length && !form.category_id) {
      form.category_id = list[0].id
    }
  }, { immediate: true })

  function toggleTag(id: string) {
    const i = form.tag_ids.indexOf(id)
    if (i >= 0) form.tag_ids.splice(i, 1)
    else form.tag_ids.push(id)
  }

  function triggerFileInput() {
    fileInput.value?.click()
  }

  async function uploadOneImage(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await $fetch<{ url: string }>('/api/products/upload-image', { method: 'POST', body: fd })
    return res.url
  }

  async function addImages(files: File[]) {
    if (!files.length) return
    uploadingImage.value = true
    formError.value = ''
    try {
      for (const file of files) {
        const url = await uploadOneImage(file)
        form.image_urls = [...(form.image_urls ?? []), url]
      }
      form.image_url = form.image_urls?.[0] ?? ''
    }
    catch (err: any) {
      formError.value = err?.data?.message ?? 'อัพโหลดไม่สำเร็จ'
    }
    finally {
      uploadingImage.value = false
      if (fileInput.value) fileInput.value.value = ''
    }
  }

  async function handleImageUpload(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files ?? [])
    await addImages(files)
  }

  async function handleImageDrop(e: DragEvent) {
    e.preventDefault()
    dragOverImageZone.value = false
    const files = Array.from(e.dataTransfer?.files ?? [])
      .filter(f => f.type.startsWith('image/'))
    await addImages(files)
  }

  function moveImage(from: number, to: number) {
    const list = [...(form.image_urls ?? [])]
    if (from < 0 || to < 0 || from >= list.length || to >= list.length || from === to) return
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved)
    form.image_urls = list
    form.image_url = list[0] ?? ''
  }

  function removeImage(index: number) {
    const list = [...(form.image_urls ?? [])]
    if (index < 0 || index >= list.length) return
    list.splice(index, 1)
    form.image_urls = list
    form.image_url = list[0] ?? ''
  }

  function buildPayload(): ProductInput {
    return {
      category_id: form.category_id,
      name: form.name.trim(),
      sku: form.sku.trim(),
      headline: form.headline?.trim() || null,
      description: form.description || null,
      faq_html: form.faq_html || null,
      key_features: form.key_features || null,
      features: form.features || null,
      specifications: form.specifications || null,
      image_url: form.image_url || null,
      image_urls: form.image_urls ?? [],
      base_price: Number(form.base_price) || 0,
      full_price: form.full_price != null ? Number(form.full_price) : null,
      price_range: form.price_range?.trim() || null,
      subscription_note: form.subscription_note?.trim() || null,
      purchase_only_label: form.purchase_only_label?.trim() || null,
      purchase_only_url: form.purchase_only_url?.trim() || null,
      discount_type: form.discount_type || null,
      discount_value: form.discount_value != null ? Number(form.discount_value) : null,
      service_self_clean: form.service_self_clean,
      service_technician: form.service_technician,
      service_months: form.service_months,
      installment_months: form.installment_months,
      warranty_years: form.warranty_years,
      status: form.status,
      sort_order: form.sort_order,
      is_active: form.is_active,
      tag_ids: form.tag_ids,
    }
  }

  async function save(options?: { includeDescription?: boolean }) {
    formError.value = ''
    if (!form.name.trim() || !form.sku.trim() || !form.category_id) {
      formError.value = 'กรุณากรอกชื่อ รหัสสินค้า และหมวดหมู่'
      return false
    }

    saving.value = true
    try {
      const payload = buildPayload()
      if (!options?.includeDescription) {
        delete payload.description
        delete payload.key_features
        delete payload.features
        delete payload.specifications
      }

      if (isEdit.value && productId) {
        await $fetch(`/api/products/${productId}`, { method: 'PATCH', body: payload })
        await router.push('/admin/products')
      }
      else {
        const created = await $fetch<Product>('/api/products', { method: 'POST', body: payload })
        await router.push(`/admin/products/${created.id}`)
      }
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

  async function saveSingleDetailField(field: 'description' | 'faq_html' | 'key_features' | 'features' | 'specifications') {
    if (!productId) return false
    saving.value = true
    formError.value = ''
    try {
      await $fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        body: { [field]: form[field] || null },
      })
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
    isEdit,
    form,
    saving,
    formError,
    uploadingImage,
    dragOverImageZone,
    fileInput,
    inputClass,
    btnSecondaryClass,
    pricingPreview,
    categories,
    mainCategories,
    allTags,
    loadingProduct,
    product,
    categoriesForMain,
    toggleTag,
    triggerFileInput,
    handleImageUpload,
    handleImageDrop,
    moveImage,
    removeImage,
    saveSingleDetailField,
    save,
  }
}
