<script setup lang="ts">
import type { Promotion, PromotionInput } from '~~/shared/types/promotion'
import { getPromotionLiveStatus } from '~~/shared/utils/promotionDisplay'

type PromotionRow = Promotion & { product_count: number }

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: promotions, pending, error: fetchError, refresh } = await useFetch<PromotionRow[]>('/api/promotions', {
  default: () => [],
})

const search = ref('')
const filtered = computed(() => {
  const list = promotions.value ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(p =>
    p.title.toLowerCase().includes(q)
    || p.slug.toLowerCase().includes(q),
  )
})

const stats = computed(() => {
  const list = promotions.value ?? []
  return {
    total: list.length,
    published: list.filter(p => p.status === 'published').length,
    draft: list.filter(p => p.status === 'draft').length,
    live: list.filter(p => getPromotionLiveStatus(p, { product_count: p.product_count }).live).length,
  }
})

const togglingId = ref<string | null>(null)

const dialogOpen = ref(false)
const saving = ref(false)
const formError = ref('')
const form = reactive<PromotionInput>({
  title: '',
  slug: '',
  status: 'draft',
})

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

watch(() => form.title, (title) => {
  form.slug = slugify(title)
})

function openCreate() {
  form.title = ''
  form.slug = ''
  form.status = 'draft'
  formError.value = ''
  dialogOpen.value = true
}

async function handleCreate() {
  formError.value = ''
  if (!form.title.trim() || !form.slug.trim()) {
    formError.value = 'กรุณากรอกชื่อและ slug'
    return
  }

  saving.value = true
  try {
    const created = await $fetch<Promotion>('/api/promotions', {
      method: 'POST',
      body: {
        title: form.title.trim(),
        slug: form.slug.trim(),
        status: 'draft',
      },
    })
    dialogOpen.value = false
    await navigateTo(`/admin/promotions/${created.id}`)
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'สร้างโปรโมชั่นไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}

async function handleDelete(p: PromotionRow) {
  if (!confirm(`ลบโปรโมชั่น "${p.title}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/promotions/${p.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}

function liveStatus(p: PromotionRow) {
  return getPromotionLiveStatus(p, { product_count: p.product_count })
}

async function quickPatch(id: string, patch: Partial<PromotionInput>) {
  togglingId.value = id
  try {
    await $fetch(`/api/promotions/${id}`, { method: 'PATCH', body: patch })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'อัปเดตสถานะไม่สำเร็จ')
  }
  finally {
    togglingId.value = null
  }
}

function publishOnStorefront(p: PromotionRow) {
  return quickPatch(p.id, { status: 'published', is_active: true })
}

function setDraft(p: PromotionRow) {
  return quickPatch(p.id, { status: 'draft' })
}

function toggleActive(p: PromotionRow) {
  return quickPatch(p.id, { is_active: !p.is_active })
}

function formatDateRange(p: Promotion) {
  if (!p.starts_at && !p.ends_at) return 'ไม่กำหนด'
  const fmt = (s: string) => new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  if (p.starts_at && p.ends_at) return `${fmt(p.starts_at)} – ${fmt(p.ends_at)}`
  if (p.starts_at) return `ตั้งแต่ ${fmt(p.starts_at)}`
  return `ถึง ${fmt(p.ends_at!)}`
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="โปรโมชั่น"
      description="สร้างโปรและเลือกสินค้า (รหัสสินค้า) ที่จะแสดงบนหน้าบ้าน — เลือกทั้งกลุ่มแล้วเอาบางขนาดออกได้"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
          @click="openCreate"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          สร้างโปรโมชั่น
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">ทั้งหมด</p>
        <p class="mt-1 text-2xl font-bold">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-700/80">แสดงบนหน้าร้าน</p>
        <p class="mt-1 text-2xl font-bold text-emerald-700">{{ stats.live }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">เผยแพร่</p>
        <p class="mt-1 text-2xl font-bold text-sky-600">{{ stats.published }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">แบบร่าง</p>
        <p class="mt-1 text-2xl font-bold text-gray-500">{{ stats.draft }}</p>
      </div>
    </div>

    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div class="border-b border-gray-100 p-4">
        <div class="relative max-w-xs">
          <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            v-model="search"
            type="search"
            placeholder="ค้นหาชื่อ / slug..."
            class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
          >
        </div>
      </div>

      <div v-if="fetchError" class="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ fetchError.message }}
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px] text-sm">
          <thead>
            <tr class="border-b bg-gray-50/80 text-left text-xs font-semibold uppercase text-gray-500">
              <th class="px-4 py-3">โปรโมชั่น</th>
              <th class="px-4 py-3">หน้าร้าน</th>
              <th class="px-4 py-3">เปิด/ปิด</th>
              <th class="px-4 py-3">รหัสสินค้า</th>
              <th class="px-4 py-3">ช่วงเวลา</th>
              <th class="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="6" class="py-16 text-center text-gray-400">กำลังโหลด...</td>
            </tr>
            <tr v-else-if="!filtered.length">
              <td colspan="6" class="py-16 text-center text-gray-500">
                ยังไม่มีโปรโมชั่น
              </td>
            </tr>
            <tr v-for="p in filtered" v-else :key="p.id" class="hover:bg-gray-50/80">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ p.title }}</p>
                <p class="mt-0.5 font-mono text-xs text-gray-500">/promotions/{{ p.slug }}</p>
              </td>
              <td class="px-4 py-3">
                <span
                  v-if="liveStatus(p).live"
                  class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  แสดงอยู่
                </span>
                <div v-else class="max-w-[10rem]">
                  <span class="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    ยังไม่แสดง
                  </span>
                  <p
                    v-if="liveStatus(p).reasons[0]"
                    class="mt-1 text-[10px] leading-snug text-amber-700"
                  >
                    {{ liveStatus(p).reasons[0] }}
                  </p>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-if="p.status !== 'published' || !p.is_active"
                    type="button"
                    class="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    :disabled="togglingId === p.id"
                    @click="publishOnStorefront(p)"
                  >
                    <Icon name="heroicons:globe-alt" class="h-3.5 w-3.5" />
                    เปิดหน้าร้าน
                  </button>
                  <template v-else>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      :disabled="togglingId === p.id"
                      @click="setDraft(p)"
                    >
                      แบบร่าง
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
                      :class="p.is_active
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                      :disabled="togglingId === p.id"
                      @click="toggleActive(p)"
                    >
                      {{ p.is_active ? 'ปิดชั่วคราว' : 'เปิดใช้งาน' }}
                    </button>
                  </template>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ p.product_count }} รายการ</td>
              <td class="px-4 py-3 text-gray-600">{{ formatDateRange(p) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <NuxtLink
                    v-if="liveStatus(p).live"
                    :to="`/promotions/${p.slug}`"
                    target="_blank"
                    class="inline-flex rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-emerald-700"
                    title="ดูหน้าบ้าน"
                  >
                    <Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
                  </NuxtLink>
                  <NuxtLink
                    :to="`/admin/promotions/${p.id}`"
                    class="inline-flex rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title="แก้ไข"
                  >
                    <Icon name="heroicons:pencil-square" class="h-4 w-4" />
                  </NuxtLink>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="ลบ"
                    @click="handleDelete(p)"
                  >
                    <Icon name="heroicons:trash" class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
      v-if="dialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="dialogOpen = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-gray-900">สร้างโปรโมชั่น</h2>
        <form class="mt-4 space-y-4" @submit.prevent="handleCreate">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อโปร</label>
            <input
              v-model="form.title"
              type="text"
              required
              class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              placeholder="เช่น โปรทีวี LG Subscribe"
            >
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Slug (URL)</label>
            <input
              v-model="form.slug"
              type="text"
              required
              class="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm"
              placeholder="tv-subscribe-promo"
            >
            <p class="mt-1 text-xs text-gray-500">หน้าบ้าน: /promotions/{{ form.slug || '...' }}</p>
          </div>
          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" @click="dialogOpen = false">
              ยกเลิก
            </button>
            <button
              type="submit"
              class="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? 'กำลังสร้าง...' : 'สร้างและเลือกสินค้า' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
