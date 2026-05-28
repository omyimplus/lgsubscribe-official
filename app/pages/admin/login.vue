<script setup lang="ts">
definePageMeta({ layout: 'empty' })

const router = useRouter()
const { signIn } = useAuth()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  if (!form.email || !form.password) {
    error.value = 'กรุณากรอกอีเมลและรหัสผ่าน'
    return
  }

  loading.value = true
  try {
    await signIn(form.email, form.password)
    await router.push('/admin')
  }
  catch {
    error.value = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-950 p-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500 text-xl font-bold text-white shadow-lg">
          LG
        </div>
        <h1 class="text-2xl font-bold text-white">LG Subscribe</h1>
        <p class="mt-1 text-sm text-gray-400">Backend Office</p>
      </div>

      <!-- Card -->
      <div class="rounded-2xl bg-gray-900 p-8 shadow-xl">
        <h2 class="mb-6 text-lg font-semibold text-white">เข้าสู่ระบบ</h2>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <!-- Email -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-300">
              อีเมล
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="admin@lgsubscribe.com"
              autocomplete="email"
              class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-300">
              รหัสผ่าน
            </label>
            <input
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <!-- Error -->
          <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="mt-2 w-full rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="loading">กำลังเข้าสู่ระบบ...</span>
            <span v-else>เข้าสู่ระบบ</span>
          </button>
        </form>
      </div>

      <p class="mt-6 text-center text-xs text-gray-600">
        LG Subscribe Backend Office © {{ new Date().getFullYear() }}
      </p>
    </div>
  </div>
</template>
