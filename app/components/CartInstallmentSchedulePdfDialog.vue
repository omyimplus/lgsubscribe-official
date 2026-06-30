<script setup lang="ts">
import type { InquiryItem } from '~~/shared/types/inquiry'

const props = defineProps<{
  open: boolean
  items: InquiryItem[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const pdf = useCartInstallmentSchedulePdf()
const customerSession = useCustomerSession()

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

function close() {
  emit('update:open', false)
}

function resetForm() {
  error.value = ''
  success.value = ''
  loading.value = false
}

watch(() => props.open, (open) => {
  if (!open) {
    resetForm()
    return
  }
  error.value = ''
  success.value = ''
  const preset = customerSession.user.value?.email?.trim()
    || customerSession.profile.value?.email?.trim()
  if (preset && !email.value) {
    email.value = preset
  }
})

async function onSubmit() {
  if (!props.items.length) return
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const result = await pdf.requestPdfByEmail(props.items, email.value)
    success.value = result.message
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }, message?: string }
    error.value = err.data?.message || err.message || 'ส่งอีเมลไม่สำเร็จ'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
        @click.self="close"
      >
        <div
          class="w-full max-w-md rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-pdf-email-title"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3.5 sm:px-5">
            <h2 id="cart-pdf-email-title" class="text-base font-bold text-gray-900">
              รับ PDF ตารางผ่อน
            </h2>
            <button
              type="button"
              class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="ปิด"
              @click="close"
            >
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </button>
          </div>

          <div class="px-4 py-4 sm:px-5 sm:py-5">
            <p class="text-sm text-gray-600">
              กรอกอีเมลเพื่อรับไฟล์ PDF ตารางชำระรายเดือนตามรายการในตะกร้า
            </p>

            <form class="mt-4 space-y-3" @submit.prevent="onSubmit">
              <div>
                <label for="cart-pdf-email" class="mb-1 block text-sm font-medium text-gray-700">
                  อีเมล
                </label>
                <input
                  id="cart-pdf-email"
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none ring-[#ea1917]/30 focus:border-[#ea1917] focus:ring-2"
                  placeholder="you@example.com"
                  :disabled="loading || !!success"
                >
              </div>

              <p v-if="error" class="text-sm text-red-600">
                {{ error }}
              </p>
              <p v-if="success" class="text-sm font-medium text-green-700">
                {{ success }}
              </p>

              <div class="flex gap-2 pt-1">
                <button
                  type="button"
                  class="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  @click="close"
                >
                  {{ success ? 'ปิด' : 'ยกเลิก' }}
                </button>
                <button
                  v-if="!success"
                  type="submit"
                  class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#ea1917] py-2.5 text-sm font-semibold text-white hover:bg-[#d41715] disabled:opacity-60"
                  :disabled="loading || !email.trim()"
                >
                  <Icon
                    v-if="loading"
                    name="heroicons:arrow-path"
                    class="h-4 w-4 animate-spin"
                  />
                  <Icon
                    v-else
                    name="heroicons:paper-airplane"
                    class="h-4 w-4"
                  />
                  ส่ง PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
