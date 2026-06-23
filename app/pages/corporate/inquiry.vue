<script setup lang="ts">
import type { SubscriptionInquiryInput } from '~~/shared/types/inquiry'
import SubscribeInquiryForm from '~/components/subscribe/SubscribeInquiryForm.vue'
import { SEO_CORPORATE_INQUIRY } from '~~/shared/utils/siteSeoPresets'

definePageMeta({
  layout: 'default',
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: 'ลูกค้าองค์กร', to: '/corporate' },
    { label: 'กรอกข้อมูลองค์กร' },
  ],
})

useSiteSeoFromPreset(SEO_CORPORATE_INQUIRY)

const { $supabase } = useNuxtApp()
const { lineOaUrl } = useLineOa()
const submitting = ref(false)
const error = ref('')
const success = ref<{ id: string, line_summary: string } | null>(null)
const copied = ref(false)

async function handleFormSubmit(payload: SubscriptionInquiryInput) {
  error.value = ''
  submitting.value = true
  try {
    const headers: Record<string, string> = {}
    const { data: { session } } = await $supabase.auth.getSession()
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    const res = await $fetch<{ id: string, line_summary: string }>('/api/public/subscribe-inquiries', {
      method: 'POST',
      headers,
      body: {
        ...payload,
        applicant_type: 'corporate',
        inquiry_source: 'corporate',
        items: [],
      },
    })

    success.value = res
  }
  catch (err: any) {
    error.value = err?.data?.message ?? 'ส่งคำขอไม่สำเร็จ'
  }
  finally {
    submitting.value = false
  }
}

async function copySummary() {
  if (!success.value?.line_summary) return
  try {
    await navigator.clipboard.writeText(success.value.line_summary)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch { /* ignore */ }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <main class="index-container max-w-3xl py-8 sm:py-12">
      <template v-if="success">
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <Icon name="heroicons:check-circle" class="mx-auto h-12 w-12 text-emerald-600" />
          <h1 class="mt-3 text-xl font-bold text-gray-900">
            ส่งข้อมูลองค์กรแล้ว
          </h1>
          <p class="mt-2 text-sm text-gray-600">
            ทีมงานจะติดต่อกลับเพื่อให้คำปรึกษาแผน LG Subscribe สำหรับองค์กรของคุณ
          </p>
          <div class="mt-5 flex flex-wrap justify-center gap-3">
            <a
              v-if="lineOaUrl"
              :href="lineOaUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              เปิด Line OA
            </a>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
              @click="copySummary"
            >
              {{ copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความสรุป' }}
            </button>
            <NuxtLink
              to="/corporate"
              class="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              กลับหน้าลูกค้าองค์กร
            </NuxtLink>
          </div>
          <pre class="mt-4 max-h-48 overflow-auto rounded-xl bg-white p-3 text-left text-xs text-gray-700">{{ success.line_summary }}</pre>
        </div>
      </template>

      <template v-else>
        <h1 class="text-2xl font-bold text-gray-900">
          กรอกข้อมูลสำหรับองค์กร
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          แบบฟอร์มนิติบุคคล — ทีมงานจะติดต่อกลับเพื่อแนะนำแผนรายเดือนที่เหมาะกับธุรกิจของคุณ
        </p>

        <section class="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <SubscribeInquiryForm
            locked-applicant-type="corporate"
            :submitting="submitting"
            :error="error"
            @submit="handleFormSubmit"
          />
        </section>
      </template>
    </main>
  </div>
</template>
