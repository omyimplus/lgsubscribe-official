<script setup lang="ts">
import type { CustomerExperience, CustomerExperienceInput } from '~~/shared/types/customerExperience'
import { customerExperienceImageSrc } from '~~/shared/utils/customerExperienceDisplay'
import { customerExperienceGalleryUrls } from '~~/shared/utils/customerExperienceImages'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: items, pending, error: fetchError, refresh } = await useFetch<CustomerExperience[]>(
  '/api/customer-experiences',
  { default: () => [] },
)

const search = ref('')
const filtered = computed(() => {
  const list = items.value ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(i =>
    i.title.toLowerCase().includes(q)
    || (i.description ?? '').toLowerCase().includes(q),
  )
})

const stats = computed(() => {
  const list = items.value ?? []
  return {
    total: list.length,
    active: list.filter(i => i.is_active).length,
    hidden: list.filter(i => !i.is_active).length,
  }
})

const togglingId = ref<string | null>(null)
const dialogOpen = ref(false)
const saving = ref(false)
const formError = ref('')
const form = reactive<CustomerExperienceInput>({
  title: '',
  sort_order: 0,
  is_active: true,
})

function openCreate() {
  form.title = ''
  form.sort_order = items.value?.length ?? 0
  form.is_active = true
  formError.value = ''
  dialogOpen.value = true
}

async function handleCreate() {
  formError.value = ''
  if (!form.title.trim()) {
    formError.value = 'กรุณาระบุชื่อกิจกรรม'
    return
  }

  saving.value = true
  try {
    const created = await $fetch<CustomerExperience>('/api/customer-experiences', {
      method: 'POST',
      body: {
        title: form.title.trim(),
        sort_order: form.sort_order ?? 0,
        is_active: form.is_active ?? true,
      },
    })
    dialogOpen.value = false
    await navigateTo(`/admin/customer-experiences/${created.id}`)
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'สร้างรายการไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}

async function handleDelete(item: CustomerExperience) {
  if (!confirm(`ลบ "${item.title}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/customer-experiences/${item.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}

async function toggleActive(item: CustomerExperience) {
  togglingId.value = item.id
  try {
    await $fetch(`/api/customer-experiences/${item.id}`, {
      method: 'PATCH',
      body: { is_active: !item.is_active },
    })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'อัปเดตไม่สำเร็จ')
  }
  finally {
    togglingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="Customer Experiences"
      description="อัปโหลดได้หลายรูป — เลือกหมวดสินค้าเพื่อแสดงบนหน้า PDP · รายการที่เปิดจะแสดงบนหน้าแรก"
    >
      <template #actions>
        <NuxtLink
          to="/"
          target="_blank"
          class="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
          ดูหน้าแรก
        </NuxtLink>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
          @click="openCreate"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          เพิ่มกิจกรรม
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">ทั้งหมด</p>
        <p class="mt-1 text-2xl font-bold">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-700/80">แสดงบนหน้าแรก</p>
        <p class="mt-1 text-2xl font-bold text-emerald-700">{{ stats.active }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">ปิดอยู่</p>
        <p class="mt-1 text-2xl font-bold text-gray-500">{{ stats.hidden }}</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <input
        v-model="search"
        type="search"
        placeholder="ค้นหาชื่อหรือคำอธิบาย..."
        class="w-full max-w-sm rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
      >
    </div>

    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div v-if="fetchError" class="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ fetchError.message }}
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm">
          <thead>
            <tr class="border-b bg-gray-50/80 text-left text-xs font-semibold uppercase text-gray-500">
              <th class="px-4 py-3">รูป</th>
              <th class="px-4 py-3">จำนวนรูป</th>
              <th class="px-4 py-3">ชื่อกิจกรรม</th>
              <th class="px-4 py-3">หมวด PDP</th>
              <th class="px-4 py-3">ลำดับ</th>
              <th class="px-4 py-3">แสดงบนหน้าแรก</th>
              <th class="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="7" class="py-16 text-center text-gray-400">กำลังโหลด...</td>
            </tr>
            <tr v-else-if="!(filtered?.length)">
              <td colspan="7" class="py-16 text-center text-gray-500">
                {{ search ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีกิจกรรม — กด «เพิ่มกิจกรรม»' }}
              </td>
            </tr>
            <tr v-for="item in filtered" v-else :key="item.id" class="hover:bg-gray-50/80">
              <td class="px-4 py-3">
                <div class="h-14 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  <img
                    v-if="customerExperienceGalleryUrls(item.image_urls, item.image_url)[0]"
                    :src="customerExperienceImageSrc(customerExperienceGalleryUrls(item.image_urls, item.image_url)[0])"
                    :alt="item.title"
                    class="size-full object-cover"
                  >
                  <div v-else class="flex size-full items-center justify-center text-gray-300">
                    <Icon name="heroicons:photo" class="h-6 w-6" />
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ customerExperienceGalleryUrls(item.image_urls, item.image_url).length }}
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ item.title }}</p>
                <p v-if="item.description" class="mt-0.5 line-clamp-1 text-xs text-gray-500">
                  {{ item.description }}
                </p>
              </td>
              <td class="px-4 py-3">
                <div v-if="item.categories?.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="category in item.categories"
                    :key="category.id"
                    class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                  >
                    {{ category.name }}
                  </span>
                </div>
                <span v-else class="text-xs text-gray-400">—</span>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ item.sort_order }}</td>
              <td class="px-4 py-3">
                <button
                  type="button"
                  role="switch"
                  :aria-checked="item.is_active"
                  class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition"
                  :class="item.is_active ? 'bg-emerald-500' : 'bg-gray-300'"
                  :disabled="togglingId === item.id"
                  @click="toggleActive(item)"
                >
                  <span
                    class="inline-block size-5 translate-y-0.5 rounded-full bg-white shadow transition"
                    :class="item.is_active ? 'translate-x-5' : 'translate-x-0.5'"
                  />
                </button>
                <span class="ml-2 text-xs text-gray-500">{{ item.is_active ? 'เปิด' : 'ปิด' }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <NuxtLink
                    :to="`/admin/customer-experiences/${item.id}`"
                    class="inline-flex rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                    title="แก้ไข"
                  >
                    <Icon name="heroicons:pencil-square" class="h-4 w-4" />
                  </NuxtLink>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    @click="handleDelete(item)"
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
        <h2 class="text-lg font-semibold text-gray-900">เพิ่มกิจกรรม</h2>
        <form class="mt-4 space-y-4" @submit.prevent="handleCreate">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อกิจกรรม</label>
            <input
              v-model="form.title"
              type="text"
              required
              class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              placeholder="เช่น LG Harmony Party"
            >
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">ลำดับ</label>
            <input v-model.number="form.sort_order" type="number" min="0" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          </div>
          <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input v-model="form.is_active" type="checkbox" class="rounded border-gray-300">
            แสดงบนหน้าแรกทันที
          </label>
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
              {{ saving ? 'กำลังสร้าง...' : 'สร้างและใส่รูป' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
