<script setup lang="ts">
import type { Category, CategoryInput } from '~~/shared/types/category'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const { data: categories, refresh, pending, error: fetchError } = await useFetch<Category[]>('/api/categories', {
  default: () => [],
})

const { data: mainCategories } = await useFetch<import('~~/shared/types/main-category').MainCategory[]>('/api/main-categories', {
  default: () => [],
})

const search = ref('')
const filtered = computed(() => {
  const list = categories.value ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(c =>
    c.name.toLowerCase().includes(q)
    || c.slug.toLowerCase().includes(q)
    || c.main_category?.name.toLowerCase().includes(q),
  )
})

const groupedCategories = computed(() => {
  const mains = mainCategories.value ?? []
  const list = filtered.value
  return mains
    .map(main => ({
      main,
      items: list
        .filter(c => c.main_category_id === main.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter(g => g.items.length > 0)
})

const stats = computed(() => {
  const list = categories.value ?? []
  return {
    main: mainCategories.value?.length ?? 0,
    total: list.length,
    active: list.filter(c => c.is_active).length,
    inactive: list.filter(c => !c.is_active).length,
  }
})

// ---------- Dialog ----------
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive<CategoryInput>({
  name: '',
  slug: '',
  main_category_id: '',
  icon: '',
  description: '',
  sort_order: 0,
  is_active: true,
})
const saving = ref(false)
const formError = ref('')
const uploadingIcon = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const dialogTitle = computed(() =>
  editingId.value ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่',
)

function resetForm() {
  editingId.value = null
  form.name = ''
  form.slug = ''
  form.main_category_id = mainCategories.value?.[0]?.id ?? ''
  form.icon = ''
  form.description = ''
  form.sort_order = 0
  form.is_active = true
  formError.value = ''
}

function openCreate() {
  resetForm()
  dialogOpen.value = true
}

function openEdit(c: Category) {
  editingId.value = c.id
  form.name = c.name
  form.slug = c.slug
  form.main_category_id = c.main_category_id ?? ''
  form.icon = c.icon ?? ''
  form.description = c.description ?? ''
  form.sort_order = c.sort_order
  form.is_active = c.is_active
  formError.value = ''
  dialogOpen.value = true
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

watch(() => form.name, (newName) => {
  if (editingId.value) return
  form.slug = slugify(newName)
})

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleIconUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingIcon.value = true
  formError.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await $fetch<{ url: string }>('/api/categories/upload-icon', {
      method: 'POST',
      body: formData,
    })
    form.icon = res.url
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'อัพโหลดไม่สำเร็จ'
  }
  finally {
    uploadingIcon.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function removeIcon() {
  form.icon = ''
}

async function handleSave() {
  formError.value = ''
  if (!form.name.trim() || !form.slug.trim() || !form.main_category_id) {
    formError.value = 'กรุณากรอกชื่อ slug และเลือกกลุ่มหมวดหมู่'
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      main_category_id: form.main_category_id,
      icon: form.icon || null,
      description: form.description?.trim() || null,
      sort_order: form.sort_order ?? 0,
      is_active: form.is_active ?? true,
    }

    if (editingId.value) {
      await $fetch(`/api/categories/${editingId.value}`, {
        method: 'PATCH',
        body: payload,
      })
    }
    else {
      await $fetch('/api/categories', {
        method: 'POST',
        body: payload,
      })
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

async function handleDelete(c: Category) {
  if (!confirm(`ลบหมวดหมู่ "${c.name}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/categories/${c.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}

async function toggleActive(c: Category) {
  try {
    await $fetch(`/api/categories/${c.id}`, {
      method: 'PATCH',
      body: { is_active: !c.is_active },
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
      title="หมวดหมู่สินค้า"
      description="โครงสร้าง 2 ระดับ — Main Category และหมวดย่อย"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-500/25 transition hover:bg-red-600 active:scale-[0.98]"
          @click="openCreate"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          เพิ่มหมวดหมู่
        </button>
      </template>
    </AdminPageHeader>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">กลุ่มหลัก</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats.main }}</p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">หมวดย่อย</p>
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

    <!-- Main card -->
    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <!-- Toolbar -->
      <div class="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div class="relative w-full sm:max-w-sm">
          <Icon
            name="heroicons:magnifying-glass"
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            type="search"
            placeholder="ค้นหาชื่อหรือ slug..."
            class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
          >
        </div>
        <p class="text-xs text-gray-400">
          แสดง {{ filtered.length }} รายการ
        </p>
      </div>

      <!-- Error -->
      <div
        v-if="fetchError"
        class="mx-4 my-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 sm:mx-6"
      >
        <p class="font-medium">โหลดข้อมูลไม่สำเร็จ</p>
        <p class="mt-1 text-xs opacity-90">
          {{ fetchError.message || 'ตรวจสอบ .env และรัน SQL migration ใน Supabase' }}
        </p>
      </div>

      <!-- Grouped list -->
      <div class="overflow-x-auto">
        <div v-if="pending" class="px-6 py-16 text-center text-gray-400">
          <Icon name="heroicons:arrow-path" class="mx-auto mb-2 h-6 w-6 animate-spin" />
          กำลังโหลด...
        </div>
        <div v-else-if="!groupedCategories.length" class="px-6 py-16 text-center">
          <div class="mx-auto flex max-w-xs flex-col items-center gap-3">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Icon name="heroicons:folder-plus" class="h-7 w-7 text-gray-400" />
            </div>
            <div>
              <p class="font-medium text-gray-700">ยังไม่มีหมวดหมู่</p>
              <p class="mt-1 text-xs text-gray-400">รัน migration 0004–0005 ใน Supabase หรือ seed script</p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              @click="openCreate"
            >
              <Icon name="heroicons:plus" class="h-4 w-4" />
              เพิ่มหมวดหมู่
            </button>
          </div>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="group in groupedCategories"
            :key="group.main.id"
            class="px-4 py-4 sm:px-6"
          >
            <div class="mb-3 flex items-center gap-2">
              <span class="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                {{ group.main.name }}
              </span>
              <span class="text-xs text-gray-400">{{ group.items.length }} รายการ</span>
            </div>

            <table class="w-full min-w-[600px] text-sm">
              <tbody class="divide-y divide-gray-50">
                <tr
                  v-for="c in group.items"
                  :key="c.id"
                  class="transition-colors hover:bg-gray-50/80"
                >
                  <td class="w-16 py-3 pl-2 tabular-nums text-gray-400">{{ c.sort_order }}</td>
                  <td class="py-3">
                    <div class="flex items-center gap-3">
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        <img
                          v-if="c.icon"
                          :src="c.icon"
                          :alt="c.name"
                          class="h-full w-full object-contain p-1"
                        >
                        <Icon v-else name="heroicons:photo" class="h-4 w-4 text-gray-300" />
                      </div>
                      <span class="font-medium text-gray-900">{{ c.name }}</span>
                    </div>
                  </td>
                  <td class="py-3">
                    <code class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{{ c.slug }}</code>
                  </td>
                  <td class="w-28 py-3">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      :class="c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'"
                      @click="toggleActive(c)"
                    >
                      {{ c.is_active ? 'เปิด' : 'ปิด' }}
                    </button>
                  </td>
                  <td class="w-24 py-3 text-right">
                    <button
                      type="button"
                      class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      @click="openEdit(c)"
                    >
                      <Icon name="heroicons:pencil-square" class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      @click="handleDelete(c)"
                    >
                      <Icon name="heroicons:trash" class="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Dialog (ไม่เปิดหน้าใหม่) -->
    <AdminModal v-model="dialogOpen" :title="dialogTitle">
      <form id="category-form" class="space-y-5" @submit.prevent="handleSave">
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">
              กลุ่มหมวดหมู่ (Main) <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.main_category_id"
              required
              class="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            >
              <option value="" disabled>เลือกกลุ่ม...</option>
              <option
                v-for="mc in mainCategories"
                :key="mc.id"
                :value="mc.id"
              >
                {{ mc.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">
              ชื่อหมวดหมู่ <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="เช่น เครื่องซักผ้า"
              class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
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
              placeholder="washing-machine"
              class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-mono text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            >
            <p class="mt-1.5 text-xs text-gray-400">
              ใช้ใน URL เช่น /category/washing-machine
            </p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">ไอคอน</label>
            <div class="flex items-start gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
              <div class="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                <img
                  v-if="form.icon"
                  :src="form.icon"
                  alt=""
                  class="h-full w-full object-contain p-2"
                >
                <Icon
                  v-else
                  name="heroicons:photo"
                  class="h-8 w-8 text-gray-300"
                />
                <div
                  v-if="uploadingIcon"
                  class="absolute inset-0 flex items-center justify-center bg-white/80"
                >
                  <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin text-red-500" />
                </div>
              </div>
              <div class="flex flex-col gap-2 pt-1">
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  class="hidden"
                  @change="handleIconUpload"
                >
                <button
                  type="button"
                  class="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  :disabled="uploadingIcon"
                  @click="triggerFileInput"
                >
                  <Icon name="heroicons:arrow-up-tray" class="h-4 w-4" />
                  {{ form.icon ? 'เปลี่ยนรูป' : 'อัพโหลดรูป' }}
                </button>
                <button
                  v-if="form.icon"
                  type="button"
                  class="inline-flex w-fit items-center gap-1 text-xs text-red-500 hover:underline"
                  @click="removeIcon"
                >
                  ลบรูป
                </button>
                <p class="text-xs text-gray-400">PNG, JPG, WEBP, SVG — สูงสุด 2MB</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700">ลำดับการแสดง</label>
              <input
                v-model.number="form.sort_order"
                type="number"
                min="0"
                class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
              >
            </div>
            <div class="flex items-end pb-2.5">
              <label class="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-400"
                >
                เปิดใช้งานทันที
              </label>
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">คำอธิบาย</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="คำอธิบายสั้นๆ (ไม่บังคับ)"
              class="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            />
          </div>
        </div>

        <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ formError }}
        </p>
      </form>

      <template #footer>
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200/80"
          :disabled="saving"
          @click="dialogOpen = false"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          form="category-form"
          class="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="saving || uploadingIcon"
        >
          {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </template>
    </AdminModal>
  </div>
</template>
