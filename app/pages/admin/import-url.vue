<script setup lang="ts">
import { categoriesGroupedByMain } from '~~/shared/utils/categoryDisplay'
import type { Category } from '~~/shared/types/category'
import type { MainCategory } from '~~/shared/types/main-category'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type ImportBatch = {
  id: string
  source: string
  status: 'draft' | 'promoted' | 'failed'
  note: string | null
  created_at: string
}

type ImportItem = {
  id: string
  batch_id: string
  name: string
  sku: string
  base_price: number
  source_url: string | null
  variant_group_key?: string | null
  variant_label?: string | null
}

type CatalogItem = {
  sku: string
  name: string | null
  source_url: string
  base_price: number | null
  full_price: number | null
  variant_label: string | null
  lg_model_id?: string | null
  variant_group_key?: string | null
  shared_detail_url?: string | null
  headline?: string | null
  warranty_years?: number | null
  subscription_note?: string | null
  purchase_only_label?: string | null
  purchase_only_url?: string | null
  status: 'new' | 'exists'
}

type CatalogGroup = {
  groupKey: string
  displayName: string
  variants: CatalogItem[]
}

type CatalogResponse = {
  source: {
    lgSlug: string
    label: string
    listUrl: string
    categorySlug: string
    categoryId: string
    categoryName: string
    variantAxis: string
    importMode?: 'subscription' | 'url'
  }
  scannedAt: string
  totalOnLg: number
  newCount: number
  existsCount: number
  missingOnLgCount: number
  items: CatalogItem[]
  groups: CatalogGroup[]
  missingOnLg: { sku: string, name: string, status: 'missing_on_lg' }[]
}

const { data: overview, pending, refresh, error: fetchError } = await useFetch<{ batch: ImportBatch | null, items: ImportItem[] }>('/api/admin/import/overview', {
  default: () => ({ batch: null, items: [] }),
})

const { data: mainCategories } = await useFetch<MainCategory[]>('/api/main-categories', { default: () => [] })
const { data: categories } = await useFetch<Category[]>('/api/categories', { default: () => [] })

const categoryGroups = computed(() =>
  categoriesGroupedByMain(mainCategories.value ?? [], categories.value ?? [], { onlyActive: true }),
)

const listUrl = ref('https://www.lg.com/th/tv-soundbars/all-tvs-soundbars/')
const catalog = ref<CatalogResponse | null>(null)
const selectedSkus = ref<Set<string>>(new Set())
/** slug หมวดต่อ SKU — ตั้งค่าเริ่มจาก scan แล้วแก้ได้ก่อน import */
const itemCategorySlugBySku = ref<Record<string, string>>({})
const scanning = ref(false)
const scanProgress = ref('')

watch(listUrl, () => {
  catalog.value = null
  selectedSkus.value = new Set()
  itemCategorySlugBySku.value = {}
})

function initItemCategoriesFromCatalog(result: CatalogResponse) {
  const defaultSlug = result.source.categorySlug
  const next: Record<string, string> = {}
  for (const item of result.items) {
    next[item.sku.toUpperCase()] = defaultSlug
  }
  itemCategorySlugBySku.value = next
}

function categorySlugForSku(sku: string) {
  return itemCategorySlugBySku.value[sku.toUpperCase()] ?? ''
}

function setCategoryForSku(sku: string, categorySlug: string) {
  itemCategorySlugBySku.value = {
    ...itemCategorySlugBySku.value,
    [sku.toUpperCase()]: categorySlug,
  }
}

function setCategoryForGroup(group: CatalogGroup, categorySlug: string) {
  const next = { ...itemCategorySlugBySku.value }
  for (const v of group.variants) {
    next[v.sku.toUpperCase()] = categorySlug
  }
  itemCategorySlugBySku.value = next
}

const importing = ref(false)
const importJobLabel = ref('')
const promoting = ref(false)
const clearing = ref(false)

const isBlockingWork = computed(() => scanning.value || importing.value)

const blockingLoader = computed(() => {
  if (scanning.value) {
    return {
      title: 'กำลังดึงรายการจาก URL LG',
      message: scanProgress.value || 'กำลังเปิดหน้ารายการสินค้า LG (อาจใช้เวลา 2–10 นาที)',
      hint: 'ห้ามปิดแท็บหรือรีเฟรชจนกว่าจะเสร็จ',
    }
  }
  if (importing.value) {
    return {
      title: 'กำลังนำเข้าสินค้า',
      message: importJobLabel.value || 'กำลังเปิดหน้า lgsubscribe และบันทึกดราฟ',
      hint: 'ห้ามปิดแท็บ รีเฟรช หรือออกจากหน้านี้จนกว่าจะเสร็จ',
    }
  }
  return null
})

onBeforeRouteLeave((_to, _from, next) => {
  if (!isBlockingWork.value) {
    next()
    return
  }
  const ok = window.confirm(
    'กำลังดึงรายการหรือนำเข้าสินค้าอยู่ — ออกจากหน้านี้ไม่ได้ยกเลิกงานบนเซิร์ฟเวอร์ แต่อาจทำให้ไม่เห็นผลลัพธ์\n\nต้องการออกจากหน้านี้หรือไม่?',
  )
  next(ok)
})

const catalogGroups = computed(() => catalog.value?.groups ?? [])

function isGroupFullySelected(group: CatalogGroup) {
  return group.variants.length > 0 && group.variants.every(v => selectedSkus.value.has(v.sku))
}

function isGroupPartiallySelected(group: CatalogGroup) {
  const n = group.variants.filter(v => selectedSkus.value.has(v.sku)).length
  return n > 0 && n < group.variants.length
}

function toggleGroup(group: CatalogGroup, checked: boolean) {
  const next = new Set(selectedSkus.value)
  for (const v of group.variants) {
    if (checked) next.add(v.sku)
    else next.delete(v.sku)
  }
  selectedSkus.value = next
}

function toggleSku(sku: string, checked: boolean) {
  const next = new Set(selectedSkus.value)
  if (checked) next.add(sku)
  else next.delete(sku)
  selectedSkus.value = next
}

function selectNewOnly() {
  const items = catalog.value?.items.filter(i => i.status === 'new') ?? []
  selectedSkus.value = new Set(items.map(i => i.sku))
}

async function handleScanCatalog() {
  const url = listUrl.value.trim()
  if (!url) {
    alert('กรุณากรอก URL หมวดสินค้า LG')
    return
  }

  scanning.value = true
  scanProgress.value = 'เริ่มงานดึงรายการ…'
  catalog.value = null
  try {
    const { jobId } = await $fetch<{ jobId: string }>('/api/admin/import/url/scan', {
      method: 'POST',
      body: { listUrl: url },
    })

    const deadline = Date.now() + 900_000
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const job = await $fetch<{
        status: string
        message: string | null
        error: string | null
        result: CatalogResponse | null
      }>(`/api/admin/import/url/scan/${jobId}`)

      if (job.message) scanProgress.value = job.message

      if (job.status === 'done' && job.result) {
        catalog.value = job.result
        initItemCategoriesFromCatalog(job.result)
        selectedSkus.value = new Set(
          job.result.items.filter(i => i.status === 'new').map(i => i.sku),
        )
        return
      }

      if (job.status === 'error') {
        throw new Error(job.error ?? 'ดึงรายการจาก LG ไม่สำเร็จ')
      }
    }

    throw new Error('ดึงรายการใช้เวลานานเกินไป — ลองใหม่อีกครั้ง')
  }
  catch (err: any) {
    const msg = err?.data?.message ?? err?.message ?? 'ดึงรายการจาก LG ไม่สำเร็จ'
    alert(typeof msg === 'string' ? msg : 'ดึงรายการจาก LG ไม่สำเร็จ (ลองใหม่หรือดู log server)')
    catalog.value = null
  }
  finally {
    scanning.value = false
    scanProgress.value = ''
  }
}

function selectedItems(skus: string[]) {
  const wanted = new Set(skus.map(s => s.toUpperCase()))
  return (catalog.value?.items ?? [])
    .filter(i => wanted.has(i.sku.toUpperCase()))
    .map(item => ({
      ...item,
      categorySlug: categorySlugForSku(item.sku),
    }))
}

function validateSelectedCategories(skus: string[]) {
  const missing = skus.filter(sku => !categorySlugForSku(sku))
  if (missing.length) {
    alert(`กรุณาเลือกหมวดสินค้าให้ครบ — ยังไม่ได้เลือก: ${missing.join(', ')}`)
    return false
  }
  return true
}

async function handleImportSelected() {
  const skus = [...selectedSkus.value]
  if (!skus.length) {
    alert('เลือก รหัสสินค้า อย่างน้อย 1 รายการ')
    return
  }
  if (!validateSelectedCategories(skus)) return
  if (!confirm(`นำเข้า ${skus.length} รายการที่เลือกเข้า Import Draft ใช่หรือไม่?`)) return

  importing.value = true
  importJobLabel.value = `นำเข้า ${skus.length} SKU จาก URL`
  try {
    const res = await $fetch<{ count: number, failed?: { skus: string[], reason: string }[] }>(
      '/api/admin/import/tvs-draft',
      {
        method: 'POST',
        body: {
          skus,
          items: selectedItems(skus),
          categorySlug: catalog.value?.source.categorySlug,
          perItemCategory: true,
          listUrl: catalog.value?.source.listUrl ?? listUrl.value.trim(),
        },
        timeout: 600_000,
      },
    )
    const failed = res.failed ?? []
    let msg = `นำเข้าดราฟสำเร็จ ${res.count} รายการ`
    if (failed.length) {
      const lines = failed.map(f => `• ${f.skus.join(', ')} — ${f.reason}`).join('\n')
      msg += `\n\nข้ามไป ${failed.length} กลุ่ม:\n${lines}`
    }
    msg += '\n\nราคา subscribe ดึงจากหน้า lgsubscribe ตอน import'
    alert(msg)
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? err?.message ?? 'นำเข้าไม่สำเร็จ')
  }
  finally {
    importing.value = false
    importJobLabel.value = ''
  }
}

async function handleConfirmMerge() {
  if (!overview.value?.batch?.id) {
    alert('ไม่พบ draft batch สำหรับยืนยัน')
    return
  }
  if (!confirm(
    'นำขึ้น Products (ผสานตาม รหัสสินค้า) ใช่หรือไม่?\n\n'
    + '• สินค้าใหม่ → เพิ่มครบทุก field\n'
    + '• สินค้าเดิม → อัปเดตราคา/รูป/หัวข้อ (ไม่ทับ description/features/specs/faq)\n'
    + '• ไม่ลบสินค้าที่ไม่ได้อยู่ใน batch นี้',
  )) return
  promoting.value = true
  try {
    const res = await $fetch<{ inserted: number, updated: number }>('/api/admin/import/confirm', {
      method: 'POST',
      body: { batchId: overview.value.batch.id },
    })
    alert(`นำขึ้น Products แล้ว — เพิ่มใหม่ ${res.inserted} รายการ, อัปเดต ${res.updated ?? 0} รายการ`)
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? err?.message ?? 'นำขึ้น Products ไม่สำเร็จ')
  }
  finally {
    promoting.value = false
  }
}

async function handleClearDrafts() {
  if (!confirm('ลบดราฟ import ทั้งหมดใช่หรือไม่? รูป mirror ของ draft ใน Storage จะถูกลบด้วย')) return
  clearing.value = true
  try {
    const res = await $fetch<{ deleted: number }>('/api/admin/import/drafts', { method: 'DELETE' })
    alert(`ลบดราฟแล้ว ${res.deleted} batch`)
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? err?.message ?? 'ลบดราฟไม่สำเร็จ')
  }
  finally {
    clearing.value = false
  }
}

function statusBadgeClass(status: CatalogItem['status'] | 'missing_on_lg') {
  if (status === 'new') return 'bg-blue-50 text-blue-700'
  if (status === 'exists') return 'bg-gray-100 text-gray-600'
  return 'bg-amber-50 text-amber-800'
}

function statusLabel(status: CatalogItem['status'] | 'missing_on_lg') {
  if (status === 'new') return 'ใหม่'
  if (status === 'exists') return 'มีในระบบ'
  return 'ไม่พบใน LG'
}

function variantLabelFromName(name: string | null | undefined) {
  if (!name) return '-'
  const btu = name.match(/(\d[\d,]*\s*BTU)/i)
  if (btu?.[1]) return btu[1]
  const inch = name.match(/\((\d+\s*(?:inch|นิ้ว|"))\)/i)
  return inch?.[1] ?? '-'
}
</script>

<template>
  <div class="space-y-6" :aria-busy="isBlockingWork">
    <AdminBlockingLoader
      v-if="blockingLoader"
      :show="isBlockingWork"
      :title="blockingLoader.title"
      :message="blockingLoader.message"
      :hint="blockingLoader.hint"
    />

    <header>
      <h1 class="text-xl font-semibold tracking-tight text-gray-900">
        Import จาก URL LG
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        วาง URL หมวดสินค้าบน lg.com — ระบบจะดึง<strong>การ์ดสินค้าทั้งหมด</strong>บนหน้านั้น
        · หมวดเริ่มต้นอนุมานจาก URL แล้ว<strong>เลือกรายการ + หมวดต่อชิ้นก่อน Import</strong>
      </p>
    </header>

    <section class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm space-y-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-gray-500">URL หมวดสินค้า LG</span>
        <input
          v-model="listUrl"
          type="url"
          placeholder="https://www.lg.com/th/tv-soundbars/all-tvs-soundbars/"
          class="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-900 focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:opacity-60"
          :disabled="isBlockingWork || promoting || clearing"
        >
      </label>

      <p class="text-xs text-gray-500">
        ตัวอย่าง: <code class="text-[11px]">tv-soundbars</code> → โทรทัศน์,
        <code class="text-[11px]">laundry</code> → ซักผ้า,
        <code class="text-[11px]">air-conditioner-inverter</code> → แอร์
        · ราคา subscribe ดึงจากหน้า <code class="text-[11px]">/lgsubscribe</code> ตอน import
      </p>

      <div class="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 disabled:opacity-60 sm:w-auto sm:min-w-[11rem]"
          :disabled="isBlockingWork || promoting || clearing"
          @click="handleScanCatalog"
        >
          <Icon name="heroicons:magnifying-glass" class="h-4 w-4 shrink-0" />
          {{ scanning ? 'กำลังดึง...' : 'ดึงรายการสินค้า' }}
        </button>
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60 sm:w-auto sm:min-w-[10rem]"
          :disabled="isBlockingWork || promoting || clearing || !selectedSkus.size"
          @click="handleImportSelected"
        >
          <Icon name="heroicons:arrow-down-tray" class="h-4 w-4 shrink-0" />
          {{ importing ? 'กำลังนำเข้า...' : `Import (${selectedSkus.size})` }}
        </button>
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60 sm:w-auto"
          :disabled="isBlockingWork || promoting || clearing"
          @click="handleClearDrafts"
        >
          <Icon name="heroicons:trash" class="h-4 w-4 shrink-0" />
          ลบดราฟ
        </button>
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60 sm:w-auto sm:min-w-[11rem]"
          :disabled="!overview.batch || isBlockingWork || promoting || clearing"
          @click="handleConfirmMerge"
        >
          <Icon name="heroicons:check-badge" class="h-4 w-4 shrink-0" />
          {{ promoting ? 'กำลังยืนยัน...' : 'นำขึ้น Products' }}
        </button>
      </div>
    </section>

    <section v-if="catalog" class="overflow-hidden rounded-2xl border border-sky-200/80 bg-white shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h3 class="text-sm font-semibold text-gray-800">
            รายการจาก {{ catalog.source.label }}
          </h3>
          <p class="mt-1 text-xs text-gray-500">
            หมวดเริ่มต้น: {{ catalog.source.categoryName }} (จาก URL — แก้ได้ต่อ SKU ในตาราง)
            · สแกนเมื่อ {{ new Date(catalog.scannedAt).toLocaleString('th-TH') }}
            · ทั้งหมด {{ catalog.totalOnLg }}
            · ใหม่ {{ catalog.newCount }}
            · มีแล้ว {{ catalog.existsCount }}
          </p>
        </div>
        <button
          type="button"
          class="text-xs font-medium text-sky-700 hover:underline"
          @click="selectNewOnly"
        >
          เลือกเฉพาะรายการใหม่
        </button>
      </div>
      <p
        v-if="!catalog.items.length"
        class="border-b border-gray-100 px-5 py-8 text-center text-sm text-gray-500"
      >
        ไม่พบสินค้าบน URL นี้ — ตรวจว่า URL ถูกต้องและหน้า LG โหลดการ์ดได้
        <a :href="catalog.source.listUrl" target="_blank" class="ml-1 text-sky-700 hover:underline">เปิดหน้า LG</a>
      </p>
      <div v-else class="max-h-[420px] overflow-y-auto">
        <p class="border-b border-gray-100 bg-gray-50/80 px-5 py-2 text-xs text-gray-500">
          {{ catalogGroups.length }} กลุ่ม · {{ catalog.items.length }} รหัสสินค้า
          · ราคาในตารางจะแสดงหลัง import (ดึงจาก lgsubscribe)
        </p>
        <div
          v-for="group in catalogGroups"
          :key="group.groupKey"
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
              <p class="truncate text-sm font-semibold text-gray-900">
                {{ group.displayName }}
              </p>
            </div>
            <label class="flex shrink-0 items-center gap-1.5 text-xs text-gray-600">
              <span class="hidden sm:inline">หมวดทั้งกลุ่ม</span>
              <select
                class="max-w-[10rem] rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                :value="categorySlugForSku(group.variants[0]?.sku ?? '')"
                @change="setCategoryForGroup(group, ($event.target as HTMLSelectElement).value)"
              >
                <optgroup v-for="g in categoryGroups" :key="g.main.id" :label="g.main.name">
                  <option v-for="c in g.categories" :key="c.id" :value="c.slug">
                    {{ c.name }}
                  </option>
                </optgroup>
              </select>
            </label>
            <span class="shrink-0 text-xs text-gray-500">{{ group.variants.length }} ขนาด</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[880px] text-sm">
              <thead>
                <tr class="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                  <th class="w-10 px-4 py-1.5 pl-10" />
                  <th class="px-4 py-1.5">รหัส</th>
                  <th class="px-4 py-1.5">ชื่อ</th>
                  <th class="px-4 py-1.5">ขนาด</th>
                  <th class="min-w-[11rem] px-4 py-1.5">หมวด (import)</th>
                  <th class="px-4 py-1.5">สถานะ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="item in group.variants" :key="item.sku" class="hover:bg-gray-50/80">
                  <td class="w-10 px-4 py-2 pl-10">
                    <input
                      type="checkbox"
                      class="rounded border-gray-300"
                      :checked="selectedSkus.has(item.sku)"
                      @change="toggleSku(item.sku, ($event.target as HTMLInputElement).checked)"
                    >
                  </td>
                  <td class="px-4 py-2 font-mono text-xs">{{ item.sku }}</td>
                  <td class="px-4 py-2 text-gray-700">{{ item.name || '-' }}</td>
                  <td class="px-4 py-2 text-gray-600">{{ item.variant_label || '-' }}</td>
                  <td class="px-4 py-2">
                    <select
                      class="w-full min-w-[10rem] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                      :class="selectedSkus.has(item.sku) && !categorySlugForSku(item.sku) ? 'border-red-300 ring-1 ring-red-100' : ''"
                      :value="categorySlugForSku(item.sku)"
                      @change="setCategoryForSku(item.sku, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="" disabled>
                        เลือกหมวด
                      </option>
                      <optgroup v-for="g in categoryGroups" :key="g.main.id" :label="g.main.name">
                        <option v-for="c in g.categories" :key="c.id" :value="c.slug">
                          {{ c.name }}
                        </option>
                      </optgroup>
                    </select>
                    <p v-if="categorySlugForSku(item.sku) !== catalog?.source.categorySlug" class="mt-0.5 text-[10px] text-amber-700">
                      ไม่ตรงค่าเริ่ม ({{ catalog?.source.categoryName }})
                    </p>
                  </td>
                  <td class="px-4 py-2">
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="statusBadgeClass(item.status)">
                      {{ statusLabel(item.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-800">สถานะ Draft Batch ปัจจุบัน</h3>
      <p v-if="!overview.batch" class="mt-2 text-sm text-gray-500">ยังไม่มี import draft</p>
      <div v-else class="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-3">
        <p><span class="text-gray-400">Batch ID:</span> {{ overview.batch.id }}</p>
        <p><span class="text-gray-400">สถานะ:</span> {{ overview.batch.status }}</p>
        <p><span class="text-gray-400">จำนวนรายการ:</span> {{ overview.items.length }}</p>
      </div>
      <p v-if="fetchError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ fetchError.message }}</p>
    </section>

    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div class="border-b border-gray-100 px-5 py-4">
        <h3 class="text-sm font-semibold text-gray-800">รายการใน Import Draft</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm">
          <thead>
            <tr class="border-b bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th class="px-4 py-3">สินค้า</th>
              <th class="px-4 py-3">รหัสสินค้า</th>
              <th class="px-4 py-3">ขนาด</th>
              <th class="px-4 py-3">ราคาเริ่มต้น</th>
              <th class="px-4 py-3">ต้นทาง</th>
              <th class="w-24 px-4 py-3 text-right">ตรวจ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="6" class="px-4 py-12 text-center text-gray-400">กำลังโหลด...</td>
            </tr>
            <tr v-else-if="!overview.items.length">
              <td colspan="6" class="px-4 py-12 text-center text-gray-500">ยังไม่มีรายการใน draft</td>
            </tr>
            <tr v-for="item in overview.items" v-else :key="item.id">
              <td class="px-4 py-3 font-medium text-gray-900">{{ item.name }}</td>
              <td class="px-4 py-3 font-mono text-xs">{{ item.sku }}</td>
              <td class="px-4 py-3 text-gray-600">{{ item.variant_label || variantLabelFromName(item.name) }}</td>
              <td class="px-4 py-3">{{ formatBaht(item.base_price ?? 0) }}</td>
              <td class="px-4 py-3">
                <a v-if="item.source_url" :href="item.source_url" target="_blank" class="text-red-600 hover:underline">ดูต้นทาง</a>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-right">
                <NuxtLink
                  :to="`/admin/import-items/${item.id}`"
                  class="inline-flex rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Icon name="heroicons:eye" class="h-4 w-4" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
