<script setup lang="ts">
import type { ServiceCareVideoSettings } from '~~/shared/types/serviceCare'
import { SERVICE_CARE_CATALOG, serviceCareFullLabel } from '~~/shared/types/serviceCare'
import { extractYoutubeVideoId, youtubeWatchUrl } from '~~/shared/utils/youtubeEmbed'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: items, pending, error: fetchError, refresh } = await useFetch<ServiceCareVideoSettings[]>(
  '/api/admin/service-care',
  { default: () => [] },
)

type FormRow = {
  slug: ServiceCareVideoSettings['slug']
  label_th: string
  icon: string
  youtube_url: string
}

const formRows = ref<FormRow[]>([])

watch(items, (rows) => {
  const bySlug = new Map(rows.map(row => [row.slug, row]))
  formRows.value = SERVICE_CARE_CATALOG.map((item) => {
    const row = bySlug.get(item.slug)
    return {
      slug: item.slug,
      label_th: row?.label_th ?? item.label_th,
      icon: item.icon,
      youtube_url: row?.youtube_url ?? '',
    }
  })
}, { immediate: true })

const saving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

function rowPreviewId(row: FormRow) {
  return extractYoutubeVideoId(row.youtube_url)
}

function rowInvalid(row: FormRow) {
  return row.youtube_url.trim().length > 0 && !rowPreviewId(row)
}

const hasInvalid = computed(() => formRows.value.some(rowInvalid))

async function handleSave() {
  saveMessage.value = ''
  saveError.value = ''

  if (hasInvalid.value) {
    saveError.value = 'มีลิงก์ YouTube ที่ไม่ถูกต้อง'
    return
  }

  saving.value = true
  try {
    await $fetch('/api/admin/service-care', {
      method: 'PATCH',
      body: {
        items: formRows.value.map(row => ({
          slug: row.slug,
          youtube_url: row.youtube_url.trim() || null,
        })),
      },
    })
    saveMessage.value = 'บันทึกแล้ว'
    await refresh()
  }
  catch (err: any) {
    saveError.value = err?.data?.message ?? err?.message ?? 'บันทึกไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="LG Service Care"
      description="ตั้งค่าวิดีโอ YouTube ต่อหมวดสินค้า — แสดงบนหน้า /installment เมื่อลูกค้ากดรายการย่อย"
    >
      <template #actions>
        <NuxtLink
          to="/installment"
          target="_blank"
          class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
          ดูหน้าร้าน
        </NuxtLink>
      </template>
    </AdminPageHeader>

    <div v-if="pending" class="text-sm text-gray-500">
      กำลังโหลด...
    </div>
    <div v-else-if="fetchError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      โหลดข้อมูลไม่สำเร็จ
    </div>

    <form v-else class="space-y-4" @submit.prevent="handleSave">
      <div
        v-for="row in formRows"
        :key="row.slug"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div class="flex items-start gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ea1917]/10 text-[#ea1917]">
            <Icon :name="row.icon" class="h-5 w-5" />
          </span>
          <div class="min-w-0 flex-1">
            <h2 class="text-sm font-semibold text-gray-900 sm:text-base">
              {{ serviceCareFullLabel(row.label_th) }}
            </h2>
            <p class="mt-1 text-xs text-gray-500">
              slug: {{ row.slug }}
            </p>

            <label class="mt-4 block text-sm font-medium text-gray-700">
              ลิงก์ YouTube
              <input
                v-model="row.youtube_url"
                type="url"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#ea1917] focus:outline-none focus:ring-1 focus:ring-[#ea1917]"
                placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
              >
            </label>

            <p v-if="rowInvalid(row)" class="mt-2 text-sm text-red-600">
              ลิงก์ YouTube ไม่ถูกต้อง
            </p>
            <p v-else-if="rowPreviewId(row)" class="mt-2 text-sm text-green-700">
              พร้อมแสดง —
              <a
                :href="youtubeWatchUrl(rowPreviewId(row)!)"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-[#ea1917] hover:underline"
              >
                เปิดดูตัวอย่าง
              </a>
            </p>
            <p v-else class="mt-2 text-sm text-gray-500">
              ว่างไว้ = ไม่แสดงรายการนี้บนหน้าร้าน
            </p>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          class="rounded-lg bg-[#ea1917] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c91412] disabled:opacity-60"
          :disabled="saving || hasInvalid"
        >
          {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
        <p v-if="saveMessage" class="text-sm text-green-700">
          {{ saveMessage }}
        </p>
        <p v-if="saveError" class="text-sm text-red-600">
          {{ saveError }}
        </p>
      </div>
    </form>
  </div>
</template>
