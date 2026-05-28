<script setup lang="ts">
import type { AdminUser, AdminUserInput, AdminUserRole } from '~~/shared/types/admin-user'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth', 'admin-role'],
})

const { getUser } = useAuth()
const currentUserId = ref<string | null>(null)

onMounted(async () => {
  const user = await getUser()
  currentUserId.value = user?.id ?? null
})

const { data: users, refresh, pending, error: fetchError } = await useFetch<AdminUser[]>('/api/admin/users', {
  default: () => [],
})

const search = ref('')
const roleFilter = ref<'all' | AdminUserRole>('all')

const roleOptions: { value: AdminUserRole, label: string }[] = [
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
  { value: 'employee', label: 'พนักงาน' },
]

function roleLabel(role: AdminUserRole) {
  return roleOptions.find(r => r.value === role)?.label ?? role
}

const filtered = computed(() => {
  const list = users.value ?? []
  const q = search.value.trim().toLowerCase()
  return list.filter((u) => {
    if (roleFilter.value !== 'all' && u.role !== roleFilter.value) return false
    if (!q) return true
    return (
      u.email.toLowerCase().includes(q)
      || u.full_name.toLowerCase().includes(q)
      || roleLabel(u.role).includes(q)
    )
  })
})

const stats = computed(() => {
  const list = users.value ?? []
  return {
    total: list.length,
    admin: list.filter(u => u.role === 'admin').length,
    employee: list.filter(u => u.role === 'employee').length,
  }
})

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  email: '',
  password: '',
  full_name: '',
  role: 'employee' as AdminUserRole,
})
const saving = ref(false)
const formError = ref('')

const dialogTitle = computed(() =>
  editingId.value ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน',
)

const isEditingSelf = computed(() =>
  editingId.value !== null && editingId.value === currentUserId.value,
)

function resetForm() {
  editingId.value = null
  form.email = ''
  form.password = ''
  form.full_name = ''
  form.role = 'employee'
  formError.value = ''
}

function openCreate() {
  resetForm()
  dialogOpen.value = true
}

function openEdit(u: AdminUser) {
  editingId.value = u.id
  form.email = u.email
  form.password = ''
  form.full_name = u.full_name
  form.role = u.role
  formError.value = ''
  dialogOpen.value = true
}

async function handleSave() {
  formError.value = ''

  if (!editingId.value) {
    if (!form.email.trim()) {
      formError.value = 'กรุณากรอกอีเมล'
      return
    }
    if (!form.password || form.password.length < 6) {
      formError.value = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
      return
    }
  }
  else if (form.password && form.password.length < 6) {
    formError.value = 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'
    return
  }

  saving.value = true
  try {
    if (editingId.value) {
      const body: Record<string, string> = {
        fullName: form.full_name.trim(),
        role: form.role,
      }
      if (form.password.trim()) body.password = form.password
      await $fetch(`/api/admin/users/${editingId.value}`, { method: 'PATCH', body })
    }
    else {
      const payload: AdminUserInput = {
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        role: form.role,
      }
      await $fetch('/api/admin/users', {
        method: 'POST',
        body: {
          email: payload.email,
          password: payload.password,
          fullName: payload.full_name,
          role: payload.role,
        },
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

async function handleDelete(u: AdminUser) {
  if (u.id === currentUserId.value) {
    alert('ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้')
    return
  }
  if (!confirm(`ลบผู้ใช้ "${u.email}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="ผู้ใช้งาน"
      description="จัดการบัญชีพนักงานและผู้ดูแลระบบ — ใช้เข้าสู่ Backend Office"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-500/25 transition hover:bg-red-600 active:scale-[0.98]"
          @click="openCreate"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          เพิ่มผู้ใช้งาน
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">ทั้งหมด</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">ผู้ดูแลระบบ</p>
        <p class="mt-1 text-2xl font-bold text-purple-600">{{ stats.admin }}</p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">พนักงาน</p>
        <p class="mt-1 text-2xl font-bold text-blue-600">{{ stats.employee }}</p>
      </div>
    </div>

    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative w-full sm:max-w-sm">
            <Icon
              name="heroicons:magnifying-glass"
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="search"
              type="search"
              placeholder="ค้นหาอีเมลหรือชื่อ..."
              class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
            >
          </div>
          <select
            v-model="roleFilter"
            class="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
          >
            <option value="all">ทุกบทบาท</option>
            <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <p class="text-xs text-gray-400">แสดง {{ filtered.length }} รายการ</p>
      </div>

      <div
        v-if="fetchError"
        class="mx-4 my-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 sm:mx-6"
      >
        <p class="font-medium">โหลดข้อมูลไม่สำเร็จ</p>
        <p class="mt-1 text-xs opacity-90">
          {{ fetchError.message || 'ตรวจสอบ NUXT_SUPABASE_SERVICE_ROLE_KEY ใน .env' }}
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th class="px-6 py-3">ชื่อ</th>
              <th class="px-6 py-3">อีเมล</th>
              <th class="px-6 py-3">บทบาท</th>
              <th class="px-6 py-3">เข้าสู่ระบบล่าสุด</th>
              <th class="px-6 py-3">สร้างเมื่อ</th>
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
                  <Icon name="heroicons:users" class="h-10 w-10 text-gray-300" />
                  <p class="font-medium text-gray-700">ยังไม่มีผู้ใช้งาน</p>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    @click="openCreate"
                  >
                    <Icon name="heroicons:plus" class="h-4 w-4" />
                    เพิ่มผู้ใช้งาน
                  </button>
                </div>
              </td>
            </tr>
            <tr
              v-for="u in filtered"
              v-else
              :key="u.id"
              class="transition-colors hover:bg-gray-50/80"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    :class="u.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'"
                  >
                    {{ (u.full_name || u.email).charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">
                      {{ u.full_name || '—' }}
                      <span
                        v-if="u.id === currentUserId"
                        class="ml-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500"
                      >คุณ</span>
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-gray-600">{{ u.email }}</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'"
                >
                  {{ roleLabel(u.role) }}
                </span>
              </td>
              <td class="px-6 py-4 text-gray-500">{{ formatDate(u.last_sign_in_at) }}</td>
              <td class="px-6 py-4 text-gray-500">{{ formatDate(u.created_at) }}</td>
              <td class="px-6 py-4 text-right">
                <button
                  type="button"
                  class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  @click="openEdit(u)"
                >
                  <Icon name="heroicons:pencil-square" class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="u.id === currentUserId"
                  :title="u.id === currentUserId ? 'ไม่สามารถลบบัญชีตัวเอง' : 'ลบ'"
                  @click="handleDelete(u)"
                >
                  <Icon name="heroicons:trash" class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <AdminModal v-model="dialogOpen" :title="dialogTitle" size="lg">
      <form id="user-form" class="space-y-5" @submit.prevent="handleSave">
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">
              อีเมล <span v-if="!editingId" class="text-red-500">*</span>
            </label>
            <input
              v-model="form.email"
              type="email"
              :required="!editingId"
              :readonly="!!editingId"
              placeholder="name@company.com"
              class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10 disabled:bg-gray-50 disabled:text-gray-500"
              :class="editingId ? 'cursor-not-allowed bg-gray-50 text-gray-600' : ''"
            >
            <p v-if="editingId" class="mt-1 text-xs text-gray-400">
              ไม่สามารถเปลี่ยนอีเมลได้จากหน้านี้
            </p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">
              รหัสผ่าน
              <span v-if="!editingId" class="text-red-500">*</span>
              <span v-else class="font-normal text-gray-400">(เว้นว่างถ้าไม่เปลี่ยน)</span>
            </label>
            <input
              v-model="form.password"
              type="password"
              :required="!editingId"
              autocomplete="new-password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            >
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
            <input
              v-model="form.full_name"
              type="text"
              placeholder="เช่น สมชาย ใจดี"
              class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            >
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">บทบาท</label>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label
                v-for="opt in roleOptions"
                :key="opt.value"
                class="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition"
                :class="form.role === opt.value ? 'border-red-400 bg-red-50/50 ring-2 ring-red-500/20' : 'border-gray-200 hover:border-gray-300'"
              >
                <input
                  v-model="form.role"
                  type="radio"
                  :value="opt.value"
                  class="text-red-500"
                >
                <span class="text-sm font-medium text-gray-800">{{ opt.label }}</span>
              </label>
            </div>
            <p v-if="isEditingSelf && form.role !== 'admin'" class="mt-2 text-xs text-amber-600">
              คำเตือน: การเปลี่ยนบทบาทของตัวเองอาจส่งผลต่อสิทธิ์การใช้งานในอนาคต
            </p>
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
          form="user-form"
          class="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          :disabled="saving"
        >
          {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </template>
    </AdminModal>
  </div>
</template>
