<script setup lang="ts">
import type { CustomerProfile } from '~~/shared/types/customer'

definePageMeta({
  layout: 'default',
  breadcrumb: [{ label: 'บัญชีของฉัน' }],
})

const router = useRouter()
const { $supabase } = useNuxtApp()
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  full_name: '',
  phone: '',
  line_id: '',
  contact_note: '',
  marketing_consent: false,
})

async function getAccessToken() {
  const { data } = await $supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

async function loadProfile() {
  error.value = ''
  loading.value = true
  try {
    const token = await getAccessToken()
    if (!token) {
      await router.push('/auth/login')
      return
    }

    const profile = await $fetch<CustomerProfile>('/api/me/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })

    form.email = profile.email
    form.full_name = profile.full_name
    form.phone = profile.phone
    form.line_id = profile.line_id
    form.contact_note = profile.contact_note
    form.marketing_consent = profile.marketing_consent
  }
  catch (err: any) {
    error.value = err?.data?.message ?? err?.message ?? 'โหลดข้อมูลไม่สำเร็จ'
  }
  finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  error.value = ''
  try {
    const token = await getAccessToken()
    if (!token) {
      await router.push('/auth/login')
      return
    }

    await $fetch('/api/me/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        full_name: form.full_name,
        phone: form.phone,
        line_id: form.line_id,
        contact_note: form.contact_note,
        marketing_consent: form.marketing_consent,
      },
    })
  }
  catch (err: any) {
    error.value = err?.data?.message ?? err?.message ?? 'บันทึกไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <main class="index-container max-w-2xl py-10 sm:py-12">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">บัญชีของฉัน</h1>
    </div>

    <div v-if="loading" class="mt-6 rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm">
      กำลังโหลดข้อมูล...
    </div>

    <form v-else class="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" @submit.prevent="saveProfile">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700">อีเมล</label>
        <input
          :value="form.email"
          type="email"
          readonly
          class="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500"
        >
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
          <input
            v-model="form.full_name"
            type="text"
            class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">เบอร์โทร</label>
          <input
            v-model="form.phone"
            type="text"
            class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700">Line ID</label>
        <input
          v-model="form.line_id"
          type="text"
          class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
        >
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700">หมายเหตุสำหรับทีมงาน</label>
        <textarea
          v-model="form.contact_note"
          rows="4"
          class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
        />
      </div>

      <label class="flex items-center gap-2 text-sm text-gray-600">
        <input v-model="form.marketing_consent" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-red-500">
        ยินยอมให้ทีมงานติดต่อกลับและรับข่าวสารโปรโมชั่น
      </label>

      <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="saving"
        class="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
      >
        {{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}
      </button>
    </form>
  </main>
</template>
