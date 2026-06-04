<script setup lang="ts">
definePageMeta({
  layout: 'default',
  breadcrumb: [{ label: 'สมัครสมาชิก' }],
})

const router = useRouter()
const { $supabase } = useNuxtApp()

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  phone: '',
  lineId: '',
  marketingConsent: false,
})

const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''

  if (!form.email.trim() || !form.password || form.password.length < 6) {
    error.value = 'กรุณากรอกอีเมล และรหัสผ่านอย่างน้อย 6 ตัวอักษร'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
        lineId: form.lineId,
        marketingConsent: form.marketingConsent,
      },
    })

    const { error: signInError } = await $supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })
    if (signInError) throw signInError

    await router.push('/account')
  }
  catch (err: any) {
    error.value = err?.data?.message ?? err?.message ?? 'สมัครสมาชิกไม่สำเร็จ'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="index-container max-w-xl py-10 sm:py-12">
    <NuxtLink to="/" class="text-sm text-gray-500 hover:text-red-600">← กลับหน้าแรก</NuxtLink>
    <h1 class="mt-4 text-2xl font-bold text-gray-900">สมัครสมาชิก</h1>
    <p class="mt-1 text-sm text-gray-500">สร้างบัญชีเพื่อบันทึกข้อมูลติดต่อและติดตามการสั่งซื้อ</p>

    <form class="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" @submit.prevent="handleRegister">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
        <input
          v-model="form.fullName"
          type="text"
          placeholder="เช่น สมชาย ใจดี"
          class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
        >
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700">อีเมล *</label>
        <input
          v-model="form.email"
          type="email"
          required
          placeholder="name@example.com"
          class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
        >
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700">รหัสผ่าน *</label>
        <input
          v-model="form.password"
          type="password"
          required
          placeholder="อย่างน้อย 6 ตัวอักษร"
          class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
        >
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">เบอร์โทร</label>
          <input
            v-model="form.phone"
            type="text"
            placeholder="08x-xxx-xxxx"
            class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">Line ID</label>
          <input
            v-model="form.lineId"
            type="text"
            placeholder="lineid"
            class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
        </div>
      </div>

      <label class="flex items-center gap-2 text-sm text-gray-600">
        <input v-model="form.marketingConsent" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-red-500">
        ยินยอมให้ทีมงานติดต่อกลับและรับข่าวสารโปรโมชั่น
      </label>

      <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
      >
        {{ loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก' }}
      </button>
    </form>

    <p class="mt-4 text-sm text-gray-500">
      มีบัญชีอยู่แล้ว?
      <NuxtLink to="/auth/login" class="font-medium text-red-600 hover:underline">เข้าสู่ระบบ</NuxtLink>
    </p>
  </main>
</template>
