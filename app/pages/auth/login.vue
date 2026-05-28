<script setup lang="ts">
definePageMeta({ layout: 'default' })

const router = useRouter()
const { $supabase } = useNuxtApp()

const form = reactive({
  email: '',
  password: '',
})
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const { error: signInError } = await $supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })
    if (signInError) throw signInError

    await router.push('/account')
  }
  catch (err: any) {
    error.value = err?.message ?? 'เข้าสู่ระบบไม่สำเร็จ'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-md px-4 py-10">
    <NuxtLink to="/" class="text-sm text-gray-500 hover:text-red-600">← กลับหน้าแรก</NuxtLink>
    <h1 class="mt-4 text-2xl font-bold text-gray-900">เข้าสู่ระบบลูกค้า</h1>

    <form class="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" @submit.prevent="handleLogin">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700">อีเมล</label>
        <input
          v-model="form.email"
          type="email"
          required
          placeholder="name@example.com"
          class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
        >
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700">รหัสผ่าน</label>
        <input
          v-model="form.password"
          type="password"
          required
          class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
        >
      </div>

      <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
      >
        {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
      </button>
    </form>

    <p class="mt-4 text-sm text-gray-500">
      ยังไม่มีบัญชี?
      <NuxtLink to="/auth/register" class="font-medium text-red-600 hover:underline">สมัครสมาชิก</NuxtLink>
    </p>
  </main>
</template>
