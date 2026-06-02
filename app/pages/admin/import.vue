<script setup lang="ts">
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

type ImportSourceOption = {
  lgSlug: string
  label: string
  categorySlug: string
  listUrl: string
  variantAxis: string
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

const importSources = ref<ImportSourceOption[]>([])
const selectedLgSlug = ref('tvs')
const catalog = ref<CatalogResponse | null>(null)
const selectedSkus = ref<Set<string>>(new Set())
const scanning = ref(false)

onMounted(async () => {
  try {
    const res = await $fetch<{ sources: ImportSourceOption[] }>('/api/admin/import/catalog/sources')
    importSources.value = res.sources
    if (!importSources.value.some(s => s.lgSlug === selectedLgSlug.value) && importSources.value[0]) {
      selectedLgSlug.value = importSources.value[0].lgSlug
    }
  }
  catch {
    importSources.value = [{
      lgSlug: 'tvs',
      label: 'โทรทัศน์',
      categorySlug: 'television',
      listUrl: '',
      variantAxis: 'screen_inches',
    }]
  }
})

watch(selectedLgSlug, () => {
  catalog.value = null
  selectedSkus.value = new Set()
})

const importing = ref(false)
const importJobLabel = ref('')
const promoting = ref(false)
const clearing = ref(false)

const selectedSourceLabel = computed(() =>
  importSources.value.find(s => s.lgSlug === selectedLgSlug.value)?.label
  ?? catalog.value?.source.label
  ?? 'สินค้า',
)

const isBlockingWork = computed(() => scanning.value || importing.value)

const blockingLoader = computed(() => {
  if (scanning.value) {
    return {
      title: 'กำลังดึงรายการจาก LG',
      message: `หมวด ${selectedSourceLabel.value} — กำลังเปิดหน้ารายการและอ่านราคา (อาจใช้เวลา 1–5 นาที)`,
      hint: 'ห้ามปิดแท็บ รีเฟรช หรือออกจากหน้านี้จนกว่าจะเสร็จ',
    }
  }
  if (importing.value) {
    return {
      title: 'กำลังนำเข้าสินค้า',
      message: importJobLabel.value || `กำลังเปิดหน้ารายละเอียดและบันทึกดราฟ — อาจใช้เวลานาน`,
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

const allSelected = computed({
  get: () => {
    const items = catalog.value?.items ?? []
    return items.length > 0 && items.every(i => selectedSkus.value.has(i.sku))
  },
  set: (checked: boolean) => {
    const items = catalog.value?.items ?? []
    selectedSkus.value = checked ? new Set(items.map(i => i.sku)) : new Set()
  },
})

function toggleSku(sku: string, checked: boolean) {
  const next = new Set(selectedSkus.value)
  if (checked) next.add(sku)
  else next.delete(sku)
  selectedSkus.value = next
}

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

function selectNewOnly() {
  const items = catalog.value?.items.filter(i => i.status === 'new') ?? []
  selectedSkus.value = new Set(items.map(i => i.sku))
}

async function handleScanCatalog() {
  scanning.value = true
  catalog.value = null
  try {
    catalog.value = await $fetch<CatalogResponse>('/api/admin/import/catalog', {
      query: { lgSlug: selectedLgSlug.value },
      timeout: 300_000,
    })
    selectedSkus.value = new Set(
      catalog.value.items.filter(i => i.status === 'new').map(i => i.sku),
    )
  }
  catch (err: any) {
    const msg = err?.data?.message ?? err?.message ?? 'ดึงรายการจาก LG ไม่สำเร็จ'
    alert(typeof msg === 'string' ? msg : 'ดึงรายการจาก LG ไม่สำเร็จ (ลองใหม่หรือดู log server)')
    catalog.value = null
  }
  finally {
    scanning.value = false
  }
}

type ImportResult = {
  count: number
  batchId: string
  failed?: { group: string, skus: string[], reason: string }[]
}

async function runImport(body: {
  importAll?: boolean
  skus?: string[]
  testLimit?: number
  items?: CatalogItem[]
  lgSlug?: string
}, jobLabel?: string) {
  importing.value = true
  importJobLabel.value = jobLabel ?? ''
  const lgSlug = body.lgSlug ?? catalog.value?.source.lgSlug ?? selectedLgSlug.value
  try {
    const res = await $fetch<ImportResult>('/api/admin/import/tvs-draft', {
      method: 'POST',
      body: { ...body, lgSlug },
      timeout: 600_000,
    })
    const failed = res.failed ?? []
    let msg = `นำเข้าดราฟสำเร็จ ${res.count} รายการ`
    if (failed.length) {
      const lines = failed.map(f => `• ${f.skus.join(', ')} — ${f.reason}`).join('\n')
      msg += `\n\nข้ามไป ${failed.length} กลุ่ม (เปิดหน้ารายละเอียดไม่ได้):\n${lines}`
    }
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

/** ส่ง catalog items ที่ scrape มาแล้ว → ไม่ต้องเปิด PLP ซ้ำ */
function selectedItems(skus: string[]) {
  const wanted = new Set(skus.map(s => s.toUpperCase()))
  return (catalog.value?.items ?? []).filter(i => wanted.has(i.sku.toUpperCase()))
}

async function handleImportSelected() {
  const skus = [...selectedSkus.value]
  if (!skus.length) {
    alert('เลือก SKU อย่างน้อย 1 รายการ')
    return
  }
  if (!confirm(`นำเข้า ${skus.length} รายการที่เลือกเข้า Import Draft ใช่หรือไม่?`)) return
  await runImport({ skus, items: selectedItems(skus) })
}

async function handleConfirmMerge() {
  if (!overview.value?.batch?.id) {
    alert('ไม่พบ draft batch สำหรับยืนยัน')
    return
  }
  if (!confirm(
    'นำขึ้น Products (ผสานตาม SKU) ใช่หรือไม่?\n\n'
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
    const res = await $fetch<{
      deleted: number
      storage: { removedFiles: number, skippedProtected: number, errors: string[] }
    }>('/api/admin/import/drafts', { method: 'DELETE' })
    const storageNote = res.storage.removedFiles
      ? ` ลบรูป mirror ${res.storage.removedFiles} ไฟล์`
      : ''
    alert(`ลบดราฟแล้ว ${res.deleted} batch${storageNote}`)
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

/** ดึงป้ายขนาดจากชื่อที่บันทึกแบบ "... (77\")" */
function variantLabelFromName(name: string | null | undefined) {
  if (!name) return '-'
  const m = name.match(/\((\d+\s*(?:inch|นิ้ว|"))\)/i)
  return m?.[1] ?? '-'
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
        Import จาก LG.com
      </h1>
    </header>

    <section class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label class="flex w-full flex-col gap-1.5 sm:w-48">
          <span class="text-xs font-medium text-gray-500">หมวด</span>
          <select
            v-model="selectedLgSlug"
            class="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:opacity-60"
            :disabled="isBlockingWork || promoting || clearing"
          >
            <option v-for="src in importSources" :key="src.lgSlug" :value="src.lgSlug">
              {{ src.label }}
            </option>
          </select>
        </label>
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 disabled:opacity-60 sm:w-auto sm:min-w-[11rem]"
          :disabled="isBlockingWork || promoting || clearing"
          @click="handleScanCatalog"
        >
          <Icon name="heroicons:magnifying-glass" class="h-4 w-4 shrink-0" />
          {{ scanning ? 'กำลังดึง...' : 'ดึงรายการจาก LG' }}
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
      </div>

      <div class="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:flex-wrap">
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
            รายการจาก LG.com — {{ catalog.source.label }}
          </h3>
          <p class="mt-1 text-xs text-gray-500">
            หมวด Products: {{ catalog.source.categoryName }}
            · สแกนเมื่อ {{ new Date(catalog.scannedAt).toLocaleString('th-TH') }}
            · ทั้งหมด {{ catalog.totalOnLg }}
            · ใหม่ {{ catalog.newCount }}
            · มีแล้ว {{ catalog.existsCount }}
            · หายจาก LG {{ catalog.missingOnLgCount }}
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
        ไม่พบสินค้าในหมวดนี้บน LG Subscribe — ลองหมวดอื่นหรือตรวจ URL ที่
        <a :href="catalog.source.listUrl" target="_blank" class="text-sky-700 hover:underline">หน้า LG</a>
      </p>
      <div v-else class="max-h-[420px] overflow-y-auto">
        <p class="border-b border-gray-100 bg-gray-50/80 px-5 py-2 text-xs text-gray-500">
          {{ catalogGroups.length }} กลุ่ม · {{ catalog.items.length }} SKU
          <span class="text-gray-400">· กลุ่ม = การ์ดเดียวบน LG (หลายขนาด)</span>
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
              <p class="truncate font-mono text-[10px] text-gray-400">
                {{ group.groupKey.startsWith('sku:') ? 'ไม่มี swatch — SKU เดียว' : group.groupKey }}
              </p>
            </div>
            <span class="shrink-0 text-xs text-gray-500">{{ group.variants.length }} ขนาด</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px] text-sm">
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
                  <td class="px-4 py-2">{{ item.base_price != null ? formatBaht(item.base_price) : '-' }}</td>
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
      <div v-if="catalog.missingOnLg.length" class="border-t border-amber-100 bg-amber-50/50 px-5 py-3">
        <p class="text-xs font-medium text-amber-900">
          มีใน Products แต่ไม่พบในรายการ LG ล่าสุด (ลูกค้าลบเองที่หน้าสินค้า):
          {{ catalog.missingOnLg.map(m => m.sku).join(', ') }}
        </p>
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
        <h3 class="text-sm font-semibold text-gray-800">รายการใน Import Draft (ตรวจก่อนนำขึ้น Products)</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm">
          <thead>
            <tr class="border-b bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th class="px-4 py-3">สินค้า</th>
              <th class="px-4 py-3">SKU</th>
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
