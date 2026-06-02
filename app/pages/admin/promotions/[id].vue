<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import type { PromotionInput, PromotionStatus, PromotionWithProducts } from '~~/shared/types/promotion'
import type { MainCategory } from '~~/shared/types/main-category'
import type { Category } from '~~/shared/types/category'
import { groupProducts, type ProductDisplayGroup } from '~~/shared/utils/productGroupDisplay'
import {
  categoriesGroupedByMain,
} from '~~/shared/utils/categoryDisplay'
import { getPromotionLiveStatus } from '~~/shared/utils/promotionDisplay'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const id = route.params.id as string

const { data: promotion, pending, error: fetchError, refresh } = await useFetch<PromotionWithProducts>(
  () => `/api/promotions/${id}`,
  { key: `promotion-${id}` },
)

const { data: catalogProducts, pending: catalogPending } = await useFetch<Product[]>('/api/products', {
  query: { status: 'published' },
  default: () => [],
})

const { data: mainCategories } = await useFetch<MainCategory[]>('/api/main-categories', { default: () => [] })
const { data: categories } = await useFetch<Category[]>('/api/categories', { default: () => [] })

const filterCategoryId = ref('')

const categoryPickerGroups = computed(() =>
  categoriesGroupedByMain(mainCategories.value ?? [], categories.value ?? [], { onlyActive: true }),
)

function productCountByCategory(categoryId: string) {
  return (catalogProducts.value ?? []).filter(p => p.category_id === categoryId).length
}

const categoryProducts = computed(() => {
  if (!filterCategoryId.value) return []
  return (catalogProducts.value ?? []).filter(p => p.category_id === filterCategoryId.value)
})

const pickerSearch = ref('')

const selectedIds = ref<Set<string>>(new Set())
const dirtyProducts = ref(false)

watch(promotion, (p) => {
  if (p && !dirtyProducts.value) {
    selectedIds.value = new Set(p.product_ids)
  }
}, { immediate: true })

watch(filterCategoryId, () => {
  pickerSearch.value = ''
})

const displayGroups = computed(() => groupProducts(categoryProducts.value))

const filteredGroups = computed(() => {
  const q = pickerSearch.value.trim().toLowerCase()
  if (!q) return displayGroups.value
  return displayGroups.value.filter(g =>
    g.displayName.toLowerCase().includes(q)
    || g.variants.some(v =>
      v.sku.toLowerCase().includes(q)
      || v.name.toLowerCase().includes(q),
    ),
  )
})

const selectedCount = computed(() => selectedIds.value.size)

const selectedInCategoryCount = computed(() =>
  categoryProducts.value.filter(p => selectedIds.value.has(p.id)).length,
)

function isProductSelected(productId: string) {
  return selectedIds.value.has(productId)
}

function isGroupFullySelected(group: ProductDisplayGroup) {
  return group.variants.length > 0 && group.variants.every(v => selectedIds.value.has(v.id))
}

function isGroupPartiallySelected(group: ProductDisplayGroup) {
  const n = group.variants.filter(v => selectedIds.value.has(v.id)).length
  return n > 0 && n < group.variants.length
}

function toggleProduct(productId: string, checked: boolean) {
  dirtyProducts.value = true
  const next = new Set(selectedIds.value)
  if (checked) next.add(productId)
  else next.delete(productId)
  selectedIds.value = next
}

function toggleGroup(group: ProductDisplayGroup, checked: boolean) {
  dirtyProducts.value = true
  const next = new Set(selectedIds.value)
  for (const v of group.variants) {
    if (checked) next.add(v.id)
    else next.delete(v.id)
  }
  selectedIds.value = next
}

function selectAllInCategory() {
  if (!filterCategoryId.value) return
  dirtyProducts.value = true
  const next = new Set(selectedIds.value)
  for (const p of categoryProducts.value) next.add(p.id)
  selectedIds.value = next
}

function clearSelectionInCategory() {
  if (!filterCategoryId.value) return
  dirtyProducts.value = true
  const next = new Set(selectedIds.value)
  for (const p of categoryProducts.value) next.delete(p.id)
  selectedIds.value = next
}

const form = reactive({
  title: '',
  slug: '',
  headline: '',
  description: '',
  image_url: '',
  starts_at: '',
  ends_at: '',
  status: 'draft' as PromotionStatus,
  is_active: true,
})

const bannerDirty = ref(false)
const bannerPreviewKey = ref(0)

watch(promotion, (p) => {
  if (!p) return
  form.title = p.title
  form.slug = p.slug
  form.headline = p.headline ?? ''
  form.description = p.description ?? ''
  if (!bannerDirty.value) {
    form.image_url = p.image_url ?? ''
    bannerPreviewKey.value++
  }
  form.starts_at = p.starts_at ? p.starts_at.slice(0, 16) : ''
  form.ends_at = p.ends_at ? p.ends_at.slice(0, 16) : ''
  form.status = p.status
  form.is_active = p.is_active
}, { immediate: true })

const saving = ref(false)
const quickStatusSaving = ref(false)
const formError = ref('')

const storefrontStatus = computed(() =>
  getPromotionLiveStatus(
    {
      status: form.status,
      is_active: form.is_active,
      starts_at: form.starts_at.trim() ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at.trim() ? new Date(form.ends_at).toISOString() : null,
    },
    { product_count: selectedCount.value },
  ),
)
const uploadingBanner = ref(false)
const bannerInput = ref<HTMLInputElement | null>(null)

const bannerPreviewSrc = computed(() => {
  const url = form.image_url.trim()
  if (!url) return ''
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${bannerPreviewKey.value}`
})

function triggerBannerInput() {
  if (bannerInput.value) bannerInput.value.value = ''
  bannerInput.value?.click()
}

async function handleBannerUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  uploadingBanner.value = true
  formError.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('promotion_id', id)
    const res = await $fetch<{ url: string }>('/api/promotions/upload-banner', {
      method: 'POST',
      body: formData,
    })
    form.image_url = res.url
    bannerDirty.value = true
    bannerPreviewKey.value++
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'อัพโหลด banner ไม่สำเร็จ'
  }
  finally {
    uploadingBanner.value = false
    if (bannerInput.value) bannerInput.value.value = ''
  }
}

function removeBanner() {
  form.image_url = ''
  bannerDirty.value = true
  bannerPreviewKey.value++
}

function toIsoOrNull(local: string) {
  if (!local.trim()) return null
  return new Date(local).toISOString()
}

async function handleSave() {
  formError.value = ''
  if (!form.title.trim() || !form.slug.trim()) {
    formError.value = 'กรุณากรอกชื่อและ slug'
    return
  }

  saving.value = true
  try {
    const payload: PromotionInput = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      headline: form.headline.trim() || null,
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      starts_at: toIsoOrNull(form.starts_at),
      ends_at: toIsoOrNull(form.ends_at),
      status: form.status,
      is_active: form.is_active,
    }

    await $fetch(`/api/promotions/${id}`, { method: 'PATCH', body: payload })
    await $fetch(`/api/promotions/${id}/products`, {
      method: 'PUT',
      body: { product_ids: [...selectedIds.value] },
    })
    dirtyProducts.value = false
    bannerDirty.value = false
    await refresh()
    bannerPreviewKey.value++
    alert('บันทึกแล้ว')
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'บันทึกไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!promotion.value) return
  if (!confirm(`ลบโปรโมชั่น "${promotion.value.title}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/promotions/${id}`, { method: 'DELETE' })
    await navigateTo('/admin/promotions')
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}
</script>

<template>
  <div class="space-y-6 pb-24">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <NuxtLink to="/admin/promotions" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
        <Icon name="heroicons:arrow-left" class="h-4 w-4" />
        กลับรายการโปรโมชั่น
      </NuxtLink>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-if="storefrontStatus.live && form.slug"
          :to="`/promotions/${form.slug}`"
          target="_blank"
          class="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
        >
          <Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
          ดูหน้าบ้าน
        </NuxtLink>
        <button
          type="button"
          class="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          @click="handleDelete"
        >
          ลบโปร
        </button>
      </div>
    </div>

    <div v-if="pending" class="py-20 text-center text-gray-400">กำลังโหลด...</div>
    <div v-else-if="fetchError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ fetchError.message }}
    </div>

    <template v-else-if="promotion">
      <AdminPageHeader
        :title="promotion.title"
        :description="`Slug: ${promotion.slug} · เลือกแล้ว ${selectedCount} SKU`"
      />

      <section
        class="rounded-2xl border p-5 shadow-sm"
        :class="storefrontStatus.live
          ? 'border-emerald-200/80 bg-emerald-50/50'
          : 'border-amber-200/80 bg-amber-50/40'"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                :class="storefrontStatus.live ? 'bg-emerald-500' : 'bg-amber-400'"
              />
              <h2 class="text-sm font-semibold text-gray-900">
                {{ storefrontStatus.live ? 'แสดงบนหน้าร้านแล้ว' : 'ยังไม่แสดงบนหน้าร้าน' }}
              </h2>
            </div>
            <p v-if="storefrontStatus.live" class="mt-1 text-sm text-emerald-800">
              ลูกค้าเห็นได้ที่
              <NuxtLink :to="`/promotions/${form.slug}`" target="_blank" class="font-mono underline">
                /promotions/{{ form.slug }}
              </NuxtLink>
              และหน้ารวมโปรโมชั่น
            </p>
            <ul v-else class="mt-2 list-inside list-disc text-sm text-amber-900/90">
              <li v-for="reason in storefrontStatus.reasons" :key="reason">{{ reason }}</li>
            </ul>
            <p class="mt-2 text-xs text-gray-500">
              ต้องเผยแพร่ + เปิดใช้งาน + อยู่ในช่วงวันที่ (ถ้ากำหนด) + มีสินค้าอย่างน้อย 1 SKU
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <button
              v-if="form.status !== 'published' || !form.is_active"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              :disabled="quickStatusSaving || saving"
              @click="publishOnStorefront"
            >
              <Icon name="heroicons:globe-alt" class="h-4 w-4" />
              {{ quickStatusSaving ? 'กำลังเปิด...' : 'เปิดหน้าร้าน' }}
            </button>
            <template v-else>
              <button
                type="button"
                class="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                :disabled="quickStatusSaving || saving"
                @click="setDraft"
              >
                เปลี่ยนเป็นแบบร่าง
              </button>
              <button
                type="button"
                class="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                :class="form.is_active
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                :disabled="quickStatusSaving || saving"
                @click="toggleActive"
              >
                {{ form.is_active ? 'ปิดชั่วคราว' : 'เปิดใช้งาน' }}
              </button>
            </template>
          </div>
        </div>
      </section>

      <form class="grid gap-6 lg:grid-cols-2" @submit.prevent="handleSave">
        <section class="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-800">ข้อมูลโปรโมชั่น</h2>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อโปร</label>
            <input v-model="form.title" type="text" required class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Slug</label>
            <input v-model="form.slug" type="text" required class="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm">
            <p class="mt-1 text-xs text-gray-500">/promotions/{{ form.slug }}</p>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Headline (optional)</label>
            <input v-model="form.headline" type="text" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">คำอธิบาย</label>
            <textarea v-model="form.description" rows="3" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">รูป Banner</label>
            <div class="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
              <div class="relative mb-3 aspect-[2/1] overflow-hidden rounded-xl border border-gray-200 bg-white">
                <img
                  v-if="form.image_url"
                  :key="bannerPreviewSrc"
                  :src="bannerPreviewSrc"
                  alt="Banner preview"
                  class="h-full w-full object-cover"
                >
                <div
                  v-else
                  class="flex h-full items-center justify-center text-gray-300"
                >
                  <Icon name="heroicons:photo" class="h-10 w-10" />
                </div>
                <div
                  v-if="uploadingBanner"
                  class="absolute inset-0 flex items-center justify-center bg-white/80"
                >
                  <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-red-500" />
                </div>
              </div>
              <input
                ref="bannerInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden"
                @change="handleBannerUpload"
              >
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  :disabled="uploadingBanner"
                  @click="triggerBannerInput"
                >
                  <Icon name="heroicons:arrow-up-tray" class="h-4 w-4" />
                  {{ form.image_url ? 'เปลี่ยนรูป' : 'อัพโหลดรูป' }}
                </button>
                <button
                  v-if="form.image_url"
                  type="button"
                  class="inline-flex items-center gap-1 text-sm text-red-500 hover:underline"
                  @click="removeBanner"
                >
                  ลบรูป
                </button>
              </div>
              <p class="mt-2 text-xs text-gray-400">PNG, JPG, WEBP — สูงสุด 5MB · แนะนำอัตราส่วน 2:1</p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">เริ่ม (optional)</label>
              <input v-model="form.starts_at" type="datetime-local" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">สิ้นสุด (optional)</label>
              <input v-model="form.ends_at" type="datetime-local" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
            </div>
          </div>

          <div class="flex flex-wrap gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">สถานะ (บันทึกพร้อมฟอร์ม)</label>
              <select v-model="form.status" class="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm">
                <option value="draft">แบบร่าง</option>
                <option value="published">เผยแพร่</option>
              </select>
            </div>
            <label class="flex cursor-pointer items-center gap-2 pt-6 text-sm text-gray-700">
              <input v-model="form.is_active" type="checkbox" class="rounded border-gray-300">
              เปิดใช้งาน
            </label>
            <p class="w-full text-xs text-gray-500">
              ใช้ปุ่ม «เปิดหน้าร้าน»ด้านบนเพื่อเผยแพร่ทันทีโดยไม่ต้องกดบันทึกทั้งหมด
            </p>
          </div>
        </section>

        <section class="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div class="border-b border-gray-100 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold text-gray-800">เลือกสินค้า (SKU)</h2>
                <p class="mt-0.5 text-xs text-gray-500">
                  เลือกทั้งกลุ่มได้ — เอาบางขนาดออกด้วยการ uncheck variant
                </p>
              </div>
              <span class="text-sm font-medium text-red-600">{{ selectedCount }} SKU</span>
            </div>
            <div class="mt-3 space-y-2">
              <select
                v-model="filterCategoryId"
                class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">— เลือกหมวดหมู่สินค้า —</option>
                <optgroup v-for="g in categoryPickerGroups" :key="g.main.id" :label="g.main.name">
                  <option
                    v-for="c in g.categories"
                    :key="c.id"
                    :value="c.id"
                    :disabled="!productCountByCategory(c.id)"
                  >
                    {{ c.name }}{{ productCountByCategory(c.id) ? ` (${productCountByCategory(c.id)} SKU)` : ' — ไม่มีสินค้า' }}
                  </option>
                </optgroup>
              </select>
              <div class="flex flex-wrap gap-2">
                <div class="relative min-w-[180px] flex-1">
                  <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    v-model="pickerSearch"
                    type="search"
                    placeholder="ค้นหา SKU / ชื่อ..."
                    class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm disabled:opacity-50"
                    :disabled="!filterCategoryId"
                  >
                </div>
                <button
                  type="button"
                  class="rounded-lg border border-gray-200 px-3 py-2 text-xs hover:bg-gray-50 disabled:opacity-40"
                  :disabled="!filterCategoryId || !categoryProducts.length"
                  @click="selectAllInCategory"
                >
                  เลือกทั้งหมดในหมวด
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-gray-200 px-3 py-2 text-xs hover:bg-gray-50 disabled:opacity-40"
                  :disabled="!filterCategoryId || !selectedInCategoryCount"
                  @click="clearSelectionInCategory"
                >
                  ล้างในหมวด
                </button>
              </div>
            </div>
          </div>

          <div v-if="catalogPending" class="p-8 text-center text-sm text-gray-400">กำลังโหลดสินค้า...</div>
          <div v-else-if="!filterCategoryId" class="p-8 text-center text-sm text-gray-500">
            เลือกหมวดหมู่ด้านบนเพื่อดูรายการสินค้า
          </div>
          <div v-else-if="!categoryProducts.length" class="p-8 text-center text-sm text-gray-500">
            ไม่มีสินค้าเผยแพร่ในหมวดนี้
          </div>
          <div v-else-if="!filteredGroups.length" class="p-8 text-center text-sm text-gray-500">ไม่พบสินค้าตามคำค้นหา</div>
          <div v-else class="max-h-[520px] overflow-y-auto">
            <p class="border-b border-gray-100 bg-gray-50/80 px-4 py-2 text-xs text-gray-500">
              {{ filteredGroups.length }} กลุ่ม · {{ categoryProducts.length }} SKU ในหมวดนี้
              <span v-if="selectedInCategoryCount">· เลือกในหมวด {{ selectedInCategoryCount }}</span>
            </p>
            <div
              v-for="group in filteredGroups"
              :key="group.groupId ?? group.variants[0]!.id"
              class="border-b border-gray-100 last:border-b-0"
            >
              <div class="flex items-center gap-3 bg-slate-50/90 px-4 py-2.5">
                <input
                  type="checkbox"
                  class="rounded border-gray-300"
                  :checked="isGroupFullySelected(group)"
                  :indeterminate="isGroupPartiallySelected(group)"
                  @change="toggleGroup(group, ($event.target as HTMLInputElement).checked)"
                >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-gray-900">{{ group.displayName }}</p>
                  <p class="text-[10px] text-gray-400">
                    {{ group.variants.length > 1 ? `${group.variants.length} ขนาด` : 'SKU เดี่ยว' }}
                  </p>
                </div>
              </div>
              <div class="divide-y divide-gray-50">
                <label
                  v-for="v in group.variants"
                  :key="v.id"
                  class="flex cursor-pointer items-center gap-3 px-4 py-2 pl-10 hover:bg-gray-50/80"
                >
                  <input
                    type="checkbox"
                    class="rounded border-gray-300"
                    :checked="isProductSelected(v.id)"
                    @change="toggleProduct(v.id, ($event.target as HTMLInputElement).checked)"
                  >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm text-gray-800">{{ v.name }}</p>
                    <p class="font-mono text-xs text-gray-500">
                      {{ v.sku }}
                      <span v-if="v.variant_label" class="text-gray-400">· {{ v.variant_label }}</span>
                    </p>
                  </div>
                  <span class="shrink-0 text-xs text-gray-600">{{ formatBaht(v.discounted_price ?? v.base_price) }}</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <p v-if="formError" class="lg:col-span-2 text-sm text-red-600">{{ formError }}</p>

        <div class="lg:col-span-2">
          <button
            type="submit"
            class="rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            :disabled="saving || uploadingBanner"
          >
            {{ saving ? 'กำลังบันทึก...' : 'บันทึกโปรโมชั่นและรายการสินค้า' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
