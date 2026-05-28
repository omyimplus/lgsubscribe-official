<script setup lang="ts">
import type { Tag, TagInput } from '~~/shared/types/tag'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const { data: tags, refresh, pending, error: fetchError } = await useFetch<Tag[]>('/api/tags', {
  default: () => [],
})

const search = ref('')
const filtered = computed(() => {
  const list = tags.value ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(t =>
    t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
  )
})

const stats = computed(() => {
  const list = tags.value ?? []
  return {
    total: list.length,
    active: list.filter(t => t.is_active).length,
    inactive: list.filter(t => !t.is_active).length,
  }
})

const colorPresets = [
  { label: 'แดง', value: '#dc2626' },
  { label: 'ส้ม', value: '#ea580c' },
  { label: 'น้ำเงิน', value: '#2563eb' },
  { label: 'ม่วง', value: '#7c3aed' },
  { label: 'เขียว', value: '#16a34a' },
  { label: 'เทา', value: '#6b7280' },
]

const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive<TagInput>({
  name: '',
  slug: '',
  color: '#dc2626',
  sort_order: 0,
  is_active: true,
})
const saving = ref(false)
const formError = ref('')

const dialogTitle = computed(() =>
  editingId.value ? 'แก้ไข Tag' : 'เพิ่ม Tag ใหม่',
)

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

watch(() => form.name, (name) => {
  if (editingId.value) return
  form.slug = slugify(name)
})

function resetForm() {
  editingId.value = null
  form.name = ''
  form.slug = ''
  form.color = '#dc2626'
  form.sort_order = (tags.value?.length ?? 0) + 1
  form.is_active = true
  formError.value = ''
}

function openCreate() {
  resetForm()
  dialogOpen.value = true
}

function openEdit(t: Tag) {
  editingId.value = t.id
  form.name = t.name
  form.slug = t.slug
  form.color = t.color
  form.sort_order = t.sort_order
  form.is_active = t.is_active
  formError.value = ''
  dialogOpen.value = true
}

async function handleSave() {
  formError.value = ''
  if (!form.name.trim() || !form.slug.trim()) {
    formError.value = 'กรุณากรอกชื่อและ slug'
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      color: form.color || '#dc2626',
      sort_order: form.sort_order ?? 0,
      is_active: form.is_active ?? true,
    }

    if (editingId.value) {
      await $fetch(`/api/tags/${editingId.value}`, { method: 'PATCH', body: payload })
    }
    else {
      await $fetch('/api/tags', { method: 'POST', body: payload })
    }
    dialogOpen.value = false
    await refresh()
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? err?.message ?? 'บันทึกไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}

async function handleDelete(t: Tag) {
  if (!confirm(`ลบ Tag "${t.name}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/tags/${t.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}

async function toggleActive(t: Tag) {
  try {
    await $fetch(`/api/tags/${t.id}`, {
      method: 'PATCH',
      body: { is_active: !t.is_active },
    })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'อัพเดทไม่สำเร็จ')
  }
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="Tags"
      description="ป้ายกำกับสินค้า — ลดราคา, มาแรง, น่าสนใจ, มาใหม่! น่าสนใจ"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-500/25 transition hover:bg-red-600 active:scale-[0.98]"
          @click="openCreate"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          เพิ่ม Tag
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">ทั้งหมด</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">เปิดใช้งาน</p>
        <p class="mt-1 text-2xl font-bold text-emerald-600">{{ stats.active }}</p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">ปิดใช้งาน</p>
        <p class="mt-1 text-2xl font-bold text-gray-500">{{ stats.inactive }}</p>
      </div>
    </div>

    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div class="relative w-full sm:max-w-sm">
          <Icon
            name="heroicons:magnifying-glass"
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            type="search"
            placeholder="ค้นหา tag..."
            class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
          >
        </div>
        <p class="text-xs text-gray-400">แสดง {{ filtered.length }} รายการ</p>
      </div>

      <div
        v-if="fetchError"
        class="mx-4 my-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 sm:mx-6"
      >
        <p class="font-medium">โหลดข้อมูลไม่สำเร็จ</p>
        <p class="mt-1 text-xs opacity-90">
          {{ fetchError.message || 'รัน migration 0006_tags.sql ใน Supabase' }}
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[560px] text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th class="w-16 px-6 py-3">ลำดับ</th>
              <th class="px-6 py-3">ตัวอย่างป้าย</th>
              <th class="px-6 py-3">ชื่อ</th>
              <th class="px-6 py-3">Slug</th>
              <th class="w-28 px-6 py-3">สถานะ</th>
              <th class="w-24 px-6 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="6" class="px-6 py-16 text-center text-gray-400">
                <Icon name="heroicons:arrow-path" class="mx-auto mb-2 h-6 w-6 animate-spin" />
                กำลังโหลด...
              </td>
            </tr>
            <tr v-else-if="!filtered.length">
              <td colspan="6" class="px-6 py-16 text-center">
                <div class="mx-auto flex max-w-xs flex-col items-center gap-3">
                  <Icon name="heroicons:hashtag" class="h-10 w-10 text-gray-300" />
                  <p class="font-medium text-gray-700">ยังไม่มี Tag</p>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    @click="openCreate"
                  >
                    <Icon name="heroicons:plus" class="h-4 w-4" />
                    เพิ่ม Tag
                  </button>
                </div>
              </td>
            </tr>
            <tr
              v-for="t in filtered"
              v-else
              :key="t.id"
              class="hover:bg-gray-50/80 transition-colors"
            >
              <td class="px-6 py-4 tabular-nums text-gray-500">{{ t.sort_order }}</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm"
                  :style="{ backgroundColor: t.color }"
                >
                  {{ t.name }}
                </span>
              </td>
              <td class="px-6 py-4 font-medium text-gray-900">{{ t.name }}</td>
              <td class="px-6 py-4">
                <code class="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">{{ t.slug }}</code>
              </td>
              <td class="px-6 py-4">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="t.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'"
                  @click="toggleActive(t)"
                >
                  {{ t.is_active ? 'เปิด' : 'ปิด' }}
                </button>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  type="button"
                  class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  @click="openEdit(t)"
                >
                  <Icon name="heroicons:pencil-square" class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  @click="handleDelete(t)"
                >
                  <Icon name="heroicons:trash" class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <AdminModal v-model="dialogOpen" :title="dialogTitle">
      <form id="tag-form" class="space-y-5" @submit.prevent="handleSave">
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">
              ชื่อ Tag <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="เช่น ลดราคา"
              class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            >
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">
              Slug <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.slug"
              type="text"
              required
              class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-mono text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            >
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">สีป้าย</label>
            <div class="flex flex-wrap items-center gap-3">
              <input
                v-model="form.color"
                type="color"
                class="h-10 w-14 cursor-pointer rounded-lg border border-gray-200"
              >
              <input
                v-model="form.color"
                type="text"
                class="w-28 rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm"
              >
              <span
                v-if="form.name"
                class="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
                :style="{ backgroundColor: form.color }"
              >
                {{ form.name }}
              </span>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="preset in colorPresets"
                :key="preset.value"
                type="button"
                class="rounded-lg border border-gray-200 px-2.5 py-1 text-xs transition hover:border-gray-300"
                :class="form.color === preset.value ? 'ring-2 ring-red-400' : ''"
                @click="form.color = preset.value"
              >
                <span
                  class="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                  :style="{ backgroundColor: preset.value }"
                />
                {{ preset.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700">ลำดับ</label>
              <input
                v-model.number="form.sort_order"
                type="number"
                min="0"
                class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
              >
            </div>
            <div class="flex items-end pb-2.5">
              <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded text-red-500">
                เปิดใช้งาน
              </label>
            </div>
          </div>
        </div>

        <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ formError }}
        </p>
      </form>

      <template #footer>
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200/80"
          :disabled="saving"
          @click="dialogOpen = false"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          form="tag-form"
          class="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          :disabled="saving"
        >
          {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </template>
    </AdminModal>
  </div>
</template>
