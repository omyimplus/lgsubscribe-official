<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import type { PromotionInput, PromotionProductOfferEnriched, PromotionProductOfferInput, PromotionStatus, PromotionWithProducts } from '~~/shared/types/promotion'
import type { MainCategory } from '~~/shared/types/main-category'
import type { Category } from '~~/shared/types/category'
import type { OfferDraft } from '~/components/admin/promotion/PromotionOffersEditor.vue'
import PromotionOffersEditor from '~/components/admin/promotion/PromotionOffersEditor.vue'
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

const offerDrafts = ref<OfferDraft[]>([])
const dirtyOffers = ref(false)
const hydratingOffers = ref(false)

function priceToInput(n: number | null | undefined) {
  if (n == null || Number.isNaN(Number(n))) return ''
  return String(n)
}

function offerFromApi(offer: PromotionProductOfferEnriched): OfferDraft {
  return {
    localId: offer.id,
    product_id: offer.product_id,
    title_override: offer.title_override ?? '',
    description: offer.description ?? '',
    has_gift: offer.has_gift,
    gifts: (offer.gift_items ?? []).map(gift => ({
      localId: `${offer.id}-${gift.product_id}-${gift.sort_order}`,
      product_id: gift.product_id,
      label: gift.label ?? '',
    })),
    installment_monthly: priceToInput(offer.installment_monthly),
    installment_total: priceToInput(offer.installment_total),
  }
}

function parsePriceInput(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '')
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function draftToOfferInput(draft: OfferDraft, index: number): PromotionProductOfferInput {
  return {
    product_id: draft.product_id,
    sort_order: index,
    title_override: draft.title_override.trim() || null,
    description: draft.description.trim() || null,
    has_gift: draft.has_gift,
    gift_items: draft.has_gift
      ? draft.gifts
          .filter(g => g.product_id)
          .map((gift, giftIndex) => ({
            product_id: gift.product_id,
            label: gift.label.trim() || null,
            sort_order: giftIndex,
          }))
      : [],
    installment_monthly: parsePriceInput(draft.installment_monthly),
    installment_total: parsePriceInput(draft.installment_total),
  }
}

watch(promotion, async (p) => {
  if (!p || dirtyOffers.value) return
  hydratingOffers.value = true
  offerDrafts.value = (p.offers ?? []).map(offerFromApi)
  await nextTick()
  hydratingOffers.value = false
}, { immediate: true })

watch(offerDrafts, () => {
  if (!hydratingOffers.value) dirtyOffers.value = true
}, { deep: true })

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

const offerCount = computed(() => offerDrafts.value.length)

const storefrontStatus = computed(() =>
  getPromotionLiveStatus(
    {
      status: form.status,
      is_active: form.is_active,
      starts_at: form.starts_at.trim() ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at.trim() ? new Date(form.ends_at).toISOString() : null,
    },
    { product_count: offerCount.value },
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

function buildPromotionPayload(): PromotionInput {
  return {
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
}

function buildOffersPayload() {
  return offerDrafts.value.map((draft, index) => draftToOfferInput(draft, index))
}

async function handleSave() {
  formError.value = ''
  if (!form.title.trim() || !form.slug.trim()) {
    formError.value = 'กรุณากรอกชื่อและ slug'
    return
  }

  saving.value = true
  try {
    await $fetch(`/api/promotions/${id}`, { method: 'PATCH', body: buildPromotionPayload() })
    await $fetch(`/api/promotions/${id}/products`, {
      method: 'PUT',
      body: { offers: buildOffersPayload() },
    })
    dirtyOffers.value = false
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

async function saveStatusOnly(patch: Partial<PromotionInput>) {
  quickStatusSaving.value = true
  formError.value = ''
  try {
    await $fetch(`/api/promotions/${id}`, {
      method: 'PATCH',
      body: { ...buildPromotionPayload(), ...patch },
    })
    if (patch.status !== undefined) form.status = patch.status
    if (patch.is_active !== undefined) form.is_active = patch.is_active
    await refresh()
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'อัพเดทสถานะไม่สำเร็จ'
  }
  finally {
    quickStatusSaving.value = false
  }
}

async function publishOnStorefront() {
  await saveStatusOnly({ status: 'published', is_active: true })
}

async function setDraft() {
  await saveStatusOnly({ status: 'draft' })
}

async function toggleActive() {
  await saveStatusOnly({ is_active: !form.is_active })
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
        :description="`Slug: ${promotion.slug} · ${offerCount} ชิ้นในหน้าโปร`"
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
              ต้องเผยแพร่ + เปิดใช้งาน + อยู่ในช่วงวันที่ (ถ้ากำหนด) + มีชิ้นสินค้าอย่างน้อย 1 ชิ้น
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

      <form class="space-y-6" @submit.prevent="handleSave">
        <section class="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-800">ข้อมูลโปรโมชั่น</h2>

          <div class="grid gap-4 lg:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อโปร</label>
              <input v-model="form.title" type="text" required class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Slug</label>
              <input v-model="form.slug" type="text" required class="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm">
              <p class="mt-1 text-xs text-gray-500">/promotions/{{ form.slug }}</p>
            </div>
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
                <div v-else class="flex h-full items-center justify-center text-gray-300">
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
          </div>
        </section>

        <PromotionOffersEditor
          v-model="offerDrafts"
          :catalog-products="catalogProducts ?? []"
          :catalog-pending="catalogPending"
          :main-categories="mainCategories ?? []"
          :categories="categories ?? []"
        />

        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

        <button
          type="submit"
          class="rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          :disabled="saving || uploadingBanner"
        >
          {{ saving ? 'กำลังบันทึก...' : 'บันทึกโปรโมชั่น' }}
        </button>
      </form>
    </template>
  </div>
</template>
