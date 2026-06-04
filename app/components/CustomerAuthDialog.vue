<script setup lang="ts">
const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10'

const router = useRouter()
const { $supabase } = useNuxtApp()
const session = useCustomerSession()
const { open, tab, redirectTo, closeAuthDialog, setTab } = useCustomerAuthDialog()

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({
  fullName: '',
  email: '',
  password: '',
  phone: '',
  lineId: '',
  marketingConsent: false,
})

const loginLoading = ref(false)
const registerLoading = ref(false)
const loginError = ref('')
const registerError = ref('')

function resetErrors() {
  loginError.value = ''
  registerError.value = ''
}

function onTabChange(next: 'login' | 'register') {
  setTab(next)
  resetErrors()
}

watch(open, (isOpen) => {
  if (!import.meta.client) return
  document.body.style.overflow = isOpen ? 'hidden' : ''
  if (!isOpen) {
    resetErrors()
  }
})

watch(() => session.isLoggedIn.value, (loggedIn) => {
  if (loggedIn && open.value) {
    closeAuthDialog()
  }
})

onUnmounted(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    closeAuthDialog()
  }
}

if (import.meta.client) {
  watch(open, (isOpen) => {
    if (isOpen) {
      window.addEventListener('keydown', onKeydown)
    }
    else {
      window.removeEventListener('keydown', onKeydown)
    }
  }, { immediate: true })
}

onUnmounted(() => {
  if (!import.meta.client) return
  window.removeEventListener('keydown', onKeydown)
})

async function afterAuthSuccess() {
  await session.refresh()
  const target = redirectTo.value || '/account'
  closeAuthDialog()
  if (router.currentRoute.value.path !== target) {
    await router.push(target)
  }
}

async function handleLogin() {
  loginError.value = ''
  loginLoading.value = true
  try {
    const { error: signInError } = await $supabase.auth.signInWithPassword({
      email: loginForm.email.trim(),
      password: loginForm.password,
    })
    if (signInError) throw signInError
    await afterAuthSuccess()
  }
  catch (err: any) {
    loginError.value = err?.message ?? 'เข้าสู่ระบบไม่สำเร็จ'
  }
  finally {
    loginLoading.value = false
  }
}

async function handleRegister() {
  registerError.value = ''

  if (!registerForm.email.trim() || !registerForm.password || registerForm.password.length < 6) {
    registerError.value = 'กรุณากรอกอีเมล และรหัสผ่านอย่างน้อย 6 ตัวอักษร'
    return
  }

  registerLoading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: registerForm.email.trim(),
        password: registerForm.password,
        fullName: registerForm.fullName,
        phone: registerForm.phone,
        lineId: registerForm.lineId,
        marketingConsent: registerForm.marketingConsent,
      },
    })

    const { error: signInError } = await $supabase.auth.signInWithPassword({
      email: registerForm.email.trim(),
      password: registerForm.password,
    })
    if (signInError) throw signInError

    await afterAuthSuccess()
  }
  catch (err: any) {
    registerError.value = err?.data?.message ?? err?.message ?? 'สมัครสมาชิกไม่สำเร็จ'
  }
  finally {
    registerLoading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-auth-dialog-title"
        @click.self="closeAuthDialog"
      >
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-2 sm:scale-[0.98]"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:translate-y-2 sm:scale-[0.98]"
        >
          <div
            v-if="open"
            class="flex max-h-[min(92vh,720px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
            @click.stop
          >
            <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 id="customer-auth-dialog-title" class="text-lg font-bold text-gray-900">
                บัญชีลูกค้า
              </h2>
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                aria-label="ปิด"
                @click="closeAuthDialog"
              >
                <Icon name="heroicons:x-mark" class="h-5 w-5" />
              </button>
            </div>

            <div class="border-b border-gray-100 px-5 py-3">
              <div class="flex rounded-full bg-gray-100 p-1">
                <button
                  type="button"
                  class="flex-1 rounded-full py-2 text-sm font-semibold transition"
                  :class="tab === 'login'
                    ? 'bg-[#ea1917] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'"
                  @click="onTabChange('login')"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  class="flex-1 rounded-full py-2 text-sm font-semibold transition"
                  :class="tab === 'register'
                    ? 'bg-[#ea1917] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'"
                  @click="onTabChange('register')"
                >
                  สมัครสมาชิก
                </button>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto px-5 py-5">
              <form
                v-if="tab === 'login'"
                class="space-y-4"
                @submit.prevent="handleLogin"
              >
                <p class="text-sm text-gray-600">
                  เข้าสู่ระบบเพื่อบันทึกข้อมูลและติดตามคำขอสนใจผ่อน
                </p>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700">อีเมล</label>
                  <input
                    v-model="loginForm.email"
                    type="email"
                    required
                    autocomplete="email"
                    placeholder="name@example.com"
                    :class="inputClass"
                  >
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700">รหัสผ่าน</label>
                  <input
                    v-model="loginForm.password"
                    type="password"
                    required
                    autocomplete="current-password"
                    :class="inputClass"
                  >
                </div>
                <p v-if="loginError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {{ loginError }}
                </p>
                <button
                  type="submit"
                  :disabled="loginLoading"
                  class="w-full rounded-xl bg-[#ea1917] py-2.5 text-sm font-semibold text-white hover:bg-[#d41715] disabled:opacity-60"
                >
                  {{ loginLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
                </button>
              </form>

              <form
                v-else
                class="space-y-4"
                @submit.prevent="handleRegister"
              >
                <p class="text-sm text-gray-600">
                  สร้างบัญชีเพื่อบันทึกข้อมูลติดต่อและติดตามการสั่งซื้อ
                </p>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                  <input
                    v-model="registerForm.fullName"
                    type="text"
                    autocomplete="name"
                    placeholder="เช่น สมชาย ใจดี"
                    :class="inputClass"
                  >
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700">อีเมล *</label>
                  <input
                    v-model="registerForm.email"
                    type="email"
                    required
                    autocomplete="email"
                    placeholder="name@example.com"
                    :class="inputClass"
                  >
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700">รหัสผ่าน *</label>
                  <input
                    v-model="registerForm.password"
                    type="password"
                    required
                    autocomplete="new-password"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    :class="inputClass"
                  >
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700">เบอร์โทร</label>
                    <input
                      v-model="registerForm.phone"
                      type="text"
                      autocomplete="tel"
                      placeholder="08x-xxx-xxxx"
                      :class="inputClass"
                    >
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700">Line ID</label>
                    <input
                      v-model="registerForm.lineId"
                      type="text"
                      placeholder="lineid"
                      :class="inputClass"
                    >
                  </div>
                </div>
                <label class="flex items-start gap-2 text-sm text-gray-600">
                  <input
                    v-model="registerForm.marketingConsent"
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-red-500"
                  >
                  <span>ยินยอมให้ทีมงานติดต่อกลับและรับข่าวสารโปรโมชั่น</span>
                </label>
                <p v-if="registerError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {{ registerError }}
                </p>
                <button
                  type="submit"
                  :disabled="registerLoading"
                  class="w-full rounded-xl bg-[#ea1917] py-2.5 text-sm font-semibold text-white hover:bg-[#d41715] disabled:opacity-60"
                >
                  {{ registerLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก' }}
                </button>
              </form>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
