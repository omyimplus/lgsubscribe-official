<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type LineOaStatus = {
  configured: boolean
  lineOaUrl: string
  webhookUrl: string
  notifyUserCount: number
  hasChannelSecret: boolean
  hasAccessToken: boolean
}

const { data: status, pending, error: fetchError, refresh } = await useFetch<LineOaStatus>(
  '/api/admin/line-oa',
  { default: () => ({
    configured: false,
    lineOaUrl: '',
    webhookUrl: '',
    notifyUserCount: 0,
    hasChannelSecret: false,
    hasAccessToken: false,
  }) },
)

const testing = ref(false)
const testMessage = ref<string | null>(null)
const testError = ref<string | null>(null)
const copiedWebhook = ref(false)

async function sendTest() {
  testing.value = true
  testMessage.value = null
  testError.value = null
  try {
    const res = await $fetch<{ ok: boolean, message: string, sentTo: number }>(
      '/api/admin/line-oa/test',
      { method: 'POST' },
    )
    testMessage.value = `ส่งสำเร็จ (${res.sentTo} ผู้รับ): ${res.message}`
  }
  catch (err: any) {
    testError.value = err?.data?.message ?? 'ส่งข้อความทดสอบไม่สำเร็จ'
  }
  finally {
    testing.value = false
  }
}

async function copyWebhookUrl() {
  const url = status.value?.webhookUrl
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    copiedWebhook.value = true
    setTimeout(() => { copiedWebhook.value = false }, 2000)
  }
  catch {
    alert('คัดลอกไม่สำเร็จ — กรุณาคัดลอกด้วยตนเอง')
  }
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="Line Official Account"
      description="แจ้งเตือนทีมงานเมื่อมีคำขอสนใจผ่อนใหม่ — ตั้งค่าผ่านตัวแปรสภาพแวดล้อม (ไม่เก็บ secret ในฐานข้อมูล)"
    >
      <template #actions>
        <NuxtLink
          to="/admin/inquiries"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Icon name="heroicons:inbox" class="h-4 w-4" />
          คำขอสนใจผ่อน
        </NuxtLink>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          @click="refresh()"
        >
          <Icon name="heroicons:arrow-path" class="h-4 w-4" />
          รีเฟรช
        </button>
      </template>
    </AdminPageHeader>

    <div
      v-if="fetchError"
      class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      โหลดสถานะไม่สำเร็จ — {{ fetchError.message }}
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">การเชื่อมต่อ Push</p>
        <p
          class="mt-1 text-lg font-bold"
          :class="status?.configured ? 'text-emerald-600' : 'text-amber-600'"
        >
          {{ pending ? '…' : status?.configured ? 'พร้อมใช้งาน' : 'ยังไม่ครบ' }}
        </p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Access Token</p>
        <p class="mt-1 text-lg font-bold text-gray-900">
          {{ status?.hasAccessToken ? 'ตั้งแล้ว' : 'ยังไม่มี' }}
        </p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Channel Secret</p>
        <p class="mt-1 text-lg font-bold text-gray-900">
          {{ status?.hasChannelSecret ? 'ตั้งแล้ว' : 'ยังไม่มี' }}
        </p>
      </div>
      <div class="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">ผู้รับแจ้งเตือน</p>
        <p class="mt-1 text-lg font-bold text-gray-900">
          {{ status?.notifyUserCount ?? 0 }} คน
        </p>
      </div>
    </div>

    <section class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900">Webhook URL</h3>
      <p class="mt-1 text-sm text-gray-500">
        ใส่ใน Line Developers Console → Messaging API → Webhook URL
        (รูปแบบ <code class="text-xs">{{ '{site}' }}/api/line/webhook</code>)
      </p>
      <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code class="flex-1 break-all rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-800">
          {{ status?.webhookUrl || '—' }}
        </code>
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          :disabled="!status?.webhookUrl"
          @click="copyWebhookUrl"
        >
          <Icon :name="copiedWebhook ? 'heroicons:check' : 'heroicons:clipboard-document'" class="h-4 w-4" />
          {{ copiedWebhook ? 'คัดลอกแล้ว' : 'คัดลอก URL' }}
        </button>
      </div>
    </section>

    <section class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900">ลิงก์ Line OA (หน้าร้าน)</h3>
      <p class="mt-1 text-sm text-gray-500">
        จาก <code class="text-xs">NUXT_PUBLIC_LINE_OA_URL</code> — ปุ่มเปิด Line หลังส่งคำขอสำเร็จ
      </p>
      <p class="mt-2 text-sm" :class="status?.lineOaUrl ? 'text-emerald-700' : 'text-amber-700'">
        {{ status?.lineOaUrl ? status.lineOaUrl : 'ยังไม่ได้ตั้งค่า' }}
      </p>
    </section>

    <section class="rounded-2xl border border-amber-100 bg-amber-50/80 p-6">
      <h3 class="text-sm font-semibold text-amber-900">ข้อจำกัด (MVP)</h3>
      <ul class="mt-2 list-inside list-disc space-y-1 text-sm text-amber-900/90">
        <li>ส่ง Push ได้เฉพาะ <strong>line_user_id</strong> ของผู้ที่เพิ่มเพื่อน OA แล้ว — ไม่สามารถ push ไปหา @line_id ที่ลูกค้ากรอกในฟอร์มได้</li>
        <li>ระบบนี้แจ้งเตือนทีมงานเมื่อมีคำขอใหม่ + รับ webhook พื้นฐาน (follow / ข้อความ)</li>
        <li>ลูกค้าเปิด Line OA เองผ่านลิงก์สาธารณะหลังส่งฟอร์ม</li>
      </ul>
    </section>

    <section class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900">ทดสอบการแจ้งเตือน</h3>
      <p class="mt-1 text-sm text-gray-500">
        ส่งข้อความ «ทดสอบ LG Subscribe Line OA» ไปยัง user id ใน LINE_NOTIFY_USER_IDS
      </p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        :disabled="testing || !status?.configured"
        @click="sendTest"
      >
        <Icon
          :name="testing ? 'heroicons:arrow-path' : 'heroicons:paper-airplane'"
          class="h-4 w-4"
          :class="{ 'animate-spin': testing }"
        />
        ส่งข้อความทดสอบ
      </button>
      <p v-if="!status?.configured && !pending" class="mt-2 text-xs text-amber-700">
        ต้องตั้ง LINE_CHANNEL_ACCESS_TOKEN และ LINE_NOTIFY_USER_IDS ก่อน
      </p>
      <p v-if="testMessage" class="mt-3 text-sm text-emerald-700">{{ testMessage }}</p>
      <p v-if="testError" class="mt-3 text-sm text-red-600">{{ testError }}</p>
    </section>

    <section class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm prose prose-sm max-w-none text-gray-700">
      <h3 class="text-sm font-semibold text-gray-900 not-prose">วิธีตั้งค่า (สรุป)</h3>
      <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm">
        <li>สร้าง Messaging API channel ที่ <a href="https://developers.line.biz/" target="_blank" rel="noopener" class="text-red-600 underline">Line Developers Console</a></li>
        <li>คัดลอก Channel access token และ Channel secret ใส่ใน <code>.env</code></li>
        <li>เปิด Webhook แล้ววาง Webhook URL ด้านบน — ใช้ HTTPS (production หรือ ngrok ตอนพัฒนา)</li>
        <li>ให้แอดมินเพิ่มเพื่อน OA จากมือถือ — ดู <code>line_user_id</code> ใน log ของ webhook เมื่อมี event <code>follow</code></li>
        <li>ใส่ user id นั้นใน <code>LINE_NOTIFY_USER_IDS</code> (คั่นด้วย comma ถ้าหลายคน) แล้วรีสตาร์ทเซิร์ฟเวอร์</li>
        <li>กด «ส่งข้อความทดสอบ» — เมื่อสำเร็จ ระบบจะ push สรุปคำขอใหม่ให้อัตโนมัติ</li>
      </ol>
    </section>
  </div>
</template>
