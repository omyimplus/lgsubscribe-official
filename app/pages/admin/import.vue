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
}

const { data: overview, pending, refresh, error: fetchError } = await useFetch<{ batch: ImportBatch | null, items: ImportItem[] }>('/api/admin/import/overview', {
  default: () => ({ batch: null, items: [] }),
})

const importing = ref(false)
const promoting = ref(false)
const clearing = ref(false)

async function handleImportTv() {
  if (!confirm('ดึงทีวี 3 รายการเข้า Import Draft ใช่หรือไม่?')) return
  importing.value = true
  try {
    const res = await $fetch<{ count: number }>('/api/admin/import/tvs-draft', { method: 'POST' })
    alert(`นำเข้าดราฟสำเร็จ ${res.count} รายการ`)
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? err?.message ?? 'นำเข้าไม่สำเร็จ')
  }
  finally {
    importing.value = false
  }
}

async function handleConfirmReplace() {
  if (!overview.value?.batch?.id) {
    alert('ไม่พบ draft batch สำหรับยืนยัน')
    return
  }
  if (!confirm('ยืนยันแทนที่ products ทั้งหมดด้วยข้อมูล import draft ชุดนี้ใช่หรือไม่?')) return
  promoting.value = true
  try {
    const res = await $fetch<{ inserted: number }>('/api/admin/import/confirm', {
      method: 'POST',
      body: { batchId: overview.value.batch.id },
    })
    alert(`แทนที่ข้อมูลสำเร็จ ${res.inserted} รายการ`)
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? err?.message ?? 'ยืนยันแทนที่ไม่สำเร็จ')
  }
  finally {
    promoting.value = false
  }
}

async function handleClearDrafts() {
  if (!confirm('ลบดราฟ import ทั้งหมดใช่หรือไม่?')) return
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
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="Import จาก LG.com"
      description="ดึงข้อมูลเข้า Import Draft ก่อน แล้วค่อยยืนยันแทนที่ products ทั้งหมด"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
          :disabled="importing || promoting || clearing"
          @click="handleImportTv"
        >
          <Icon name="heroicons:arrow-down-tray" class="h-4 w-4" />
          {{ importing ? 'กำลังนำเข้า...' : 'Import ทีวี (3 รายการ)' }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
          :disabled="!overview.batch || importing || promoting || clearing"
          @click="handleConfirmReplace"
        >
          <Icon name="heroicons:check-badge" class="h-4 w-4" />
          {{ promoting ? 'กำลังยืนยัน...' : 'ยืนยันแทนที่ Products' }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          :disabled="importing || promoting || clearing"
          @click="handleClearDrafts"
        >
          <Icon name="heroicons:trash" class="h-4 w-4" />
          {{ clearing ? 'กำลังลบ...' : 'ลบดราฟ Import ทั้งหมด' }}
        </button>
      </template>
    </AdminPageHeader>

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
              <th class="px-4 py-3">SKU</th>
              <th class="px-4 py-3">ราคาเริ่มต้น</th>
              <th class="px-4 py-3">ต้นทาง</th>
              <th class="w-24 px-4 py-3 text-right">ตรวจ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="5" class="px-4 py-12 text-center text-gray-400">กำลังโหลด...</td>
            </tr>
            <tr v-else-if="!overview.items.length">
              <td colspan="5" class="px-4 py-12 text-center text-gray-500">ยังไม่มีรายการใน draft</td>
            </tr>
            <tr v-for="item in overview.items" v-else :key="item.id">
              <td class="px-4 py-3 font-medium text-gray-900">{{ item.name }}</td>
              <td class="px-4 py-3 font-mono text-xs">{{ item.sku }}</td>
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
