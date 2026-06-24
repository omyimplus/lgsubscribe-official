<script setup lang="ts">
import type { LpCareersPageSettings } from '~~/shared/types/lpCareersPage'
import { LP_CAREERS_DEFAULT_VIDEO_TITLE } from '~~/shared/types/lpCareersPage'
import { extractYoutubeVideoId, youtubeWatchUrl } from '~~/shared/utils/youtubeEmbed'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: settings, pending, error: fetchError, refresh } = await useFetch<LpCareersPageSettings>(
  '/api/admin/lp-careers-page',
  {
    default: () => ({
      slide_image_urls: [],
      youtube_url: null,
      video_id: null,
      video_title: LP_CAREERS_DEFAULT_VIDEO_TITLE,
      updated_at: '',
    }),
  },
)

const form = reactive({
  slide_image_urls: [] as string[],
  youtube_url: '',
  video_title: LP_CAREERS_DEFAULT_VIDEO_TITLE,
})

const saving = ref(false)
const uploadingIndex = ref<number | null>(null)
const saveMessage = ref('')
const saveError = ref('')

watch(settings, (s) => {
  if (!s) return
  form.slide_image_urls = [...(s.slide_image_urls ?? [])]
  form.youtube_url = s.youtube_url ?? ''
  form.video_title = s.video_title || LP_CAREERS_DEFAULT_VIDEO_TITLE
}, { immediate: true })

const previewVideoId = computed(() => extractYoutubeVideoId(form.youtube_url))
const previewWatchUrl = computed(() =>
  previewVideoId.value ? youtubeWatchUrl(previewVideoId.value) : '',
)
const urlInvalid = computed(() =>
  form.youtube_url.trim().length > 0 && !previewVideoId.value,
)

async function uploadSlideFile(index: number, file: File) {
  uploadingIndex.value = index
  saveError.value = ''
  try {
    const { url } = await staffFormUpload<{ url: string }>('/api/admin/lp-careers-page/upload-slide', file)
    if (index >= form.slide_image_urls.length) {
      form.slide_image_urls.push(url)
    }
    else {
      form.slide_image_urls[index] = url
    }
  }
  catch (err: any) {
    saveError.value = err?.data?.message ?? err?.message ?? 'อัปโหลดไม่สำเร็จ'
  }
  finally {
    uploadingIndex.value = null
  }
}

async function uploadSlideFiles(files: File[]) {
  for (const file of files) {
    await uploadSlideFile(form.slide_image_urls.length, file)
  }
}

async function handleSave() {
  saveMessage.value = ''
  saveError.value = ''

  if (urlInvalid.value) {
    saveError.value = 'ลิงก์ YouTube ไม่ถูกต้อง'
    return
  }

  saving.value = true
  try {
    await $fetch('/api/admin/lp-careers-page', {
      method: 'PATCH',
      body: {
        slide_image_urls: form.slide_image_urls.filter(Boolean),
        youtube_url: form.youtube_url.trim() || null,
        video_title: form.video_title.trim() || LP_CAREERS_DEFAULT_VIDEO_TITLE,
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
      title="หน้าสมัคร LP"
      description="ตั้งค่ารูปสไลด์และวิดีโอ YouTube บนหน้า /careers/apply — หน้าร้านแสดงเป็นสไลด์ทีละรูป ถ้าไม่ใส่จะไม่แสดงบนหน้าร้าน"
    >
      <template #actions>
        <NuxtLink
          to="/careers/apply"
          target="_blank"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
          ดูหน้าสมัครงาน
        </NuxtLink>
      </template>
    </AdminPageHeader>

    <div v-if="fetchError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      โหลดการตั้งค่าไม่สำเร็จ
    </div>

    <div v-else-if="pending" class="py-16 text-center text-gray-500">
      กำลังโหลด...
    </div>

    <form v-else class="grid gap-6 lg:grid-cols-2" @submit.prevent="handleSave">
      <div class="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h2 class="text-base font-semibold text-gray-900">
            สไลด์รูปภาพ
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            อัปโหลดได้ไม่จำกัด — ลากวางหรือจัดลำดับได้ — หน้าร้านแสดงเป็นสไลด์ทีละรูป
          </p>
        </div>

        <AdminSlideImageList
          v-model="form.slide_image_urls"
          :uploading-index="uploadingIndex"
          :disabled="saving || uploadingIndex !== null"
          @upload="uploadSlideFile"
          @upload-files="uploadSlideFiles"
        />
      </div>

      <div class="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h2 class="text-base font-semibold text-gray-900">
            วิดีโอ YouTube
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            ไม่ใส่ลิงก์จะไม่แสดงวิดีโอบนหน้าร้าน
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">
            ลิงก์ YouTube
          </label>
          <input
            v-model="form.youtube_url"
            type="url"
            class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#ea1917] focus:ring-2 focus:ring-[#ea1917]/20"
            placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
          >
          <p v-if="urlInvalid" class="mt-1.5 text-sm text-red-600">
            ลิงก์ YouTube ไม่ถูกต้อง
          </p>
          <a
            v-else-if="previewWatchUrl"
            :href="previewWatchUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-2 inline-flex items-center gap-1 text-sm text-[#ea1917] hover:underline"
          >
            เปิดดูบน YouTube
            <Icon name="heroicons:arrow-top-right-on-square" class="h-3.5 w-3.5" />
          </a>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">
            หัวข้อวิดีโอ
          </label>
          <input
            v-model="form.video_title"
            type="text"
            maxlength="120"
            class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#ea1917] focus:ring-2 focus:ring-[#ea1917]/20"
          >
        </div>

        <div
          v-if="previewVideoId"
          class="overflow-hidden rounded-xl border border-gray-200 bg-black"
        >
          <img
            :src="`https://i.ytimg.com/vi/${previewVideoId}/hqdefault.jpg`"
            alt="ตัวอย่างวิดีโอ"
            class="aspect-video w-full object-cover"
          >
        </div>

        <p v-if="settings?.updated_at" class="text-xs text-gray-400">
          อัปเดตล่าสุด {{ new Date(settings.updated_at).toLocaleString('th-TH') }}
        </p>
      </div>

      <div class="lg:col-span-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          class="inline-flex items-center gap-2 rounded-xl bg-[#ea1917] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d01514] disabled:opacity-60"
          :disabled="saving || uploadingIndex !== null"
        >
          <Icon
            :name="saving ? 'heroicons:arrow-path' : 'heroicons:check'"
            class="h-4 w-4"
            :class="{ 'animate-spin': saving }"
          />
          บันทึก
        </button>
        <p v-if="saveMessage" class="text-sm font-medium text-emerald-600">
          {{ saveMessage }}
        </p>
        <p v-if="saveError" class="text-sm text-red-600">
          {{ saveError }}
        </p>
      </div>
    </form>
  </div>
</template>
