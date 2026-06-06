<script setup lang="ts">
import type { HomeYoutubeSettings } from '~~/shared/types/homeYoutube'
import { HOME_YOUTUBE_DEFAULT_VOLUME } from '~~/shared/types/homeYoutube'
import { extractYoutubeVideoId, youtubeWatchUrl } from '~~/shared/utils/youtubeEmbed'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: settings, pending, error: fetchError, refresh } = await useFetch<HomeYoutubeSettings>(
  '/api/admin/home-youtube',
  {
    default: () => ({
      youtube_url: null,
      video_id: null,
      title: 'วิดีโอจาก LG Subscribe',
      is_active: false,
      autoplay: false,
      default_volume: HOME_YOUTUBE_DEFAULT_VOLUME,
      updated_at: '',
    }),
  },
)

const form = reactive({
  youtube_url: '',
  title: 'วิดีโอจาก LG Subscribe',
  is_active: false,
  autoplay: false,
  default_volume: HOME_YOUTUBE_DEFAULT_VOLUME,
})

const saving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

watch(settings, (s) => {
  if (!s) return
  form.youtube_url = s.youtube_url ?? ''
  form.title = s.title || 'วิดีโอจาก LG Subscribe'
  form.is_active = s.is_active
  form.autoplay = s.autoplay ?? false
  form.default_volume = s.default_volume ?? HOME_YOUTUBE_DEFAULT_VOLUME
}, { immediate: true })

const previewVideoId = computed(() => extractYoutubeVideoId(form.youtube_url))
const previewWatchUrl = computed(() =>
  previewVideoId.value ? youtubeWatchUrl(previewVideoId.value) : '',
)
const urlInvalid = computed(() =>
  form.youtube_url.trim().length > 0 && !previewVideoId.value,
)

async function handleSave() {
  saveMessage.value = ''
  saveError.value = ''

  if (form.is_active && !previewVideoId.value) {
    saveError.value = 'เปิดแสดงไม่ได้ — ใส่ลิงก์ YouTube ที่ถูกต้องก่อน'
    return
  }

  saving.value = true
  try {
    await $fetch('/api/admin/home-youtube', {
      method: 'PATCH',
      body: {
        youtube_url: form.youtube_url.trim() || null,
        title: form.title.trim() || 'วิดีโอจาก LG Subscribe',
        is_active: form.is_active,
        autoplay: form.autoplay,
        default_volume: form.default_volume,
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
      title="YouTube หน้าแรก"
      description="ตั้งค่าวิดีโอ YouTube 1 รายการที่แสดงบนหน้าแรก — วางลิงก์จาก YouTube แล้วเปิดแสดงผล"
    >
      <template #actions>
        <NuxtLink
          to="/"
          target="_blank"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
          ดูหน้าแรก
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
          <label class="mb-1.5 block text-sm font-medium text-gray-700">
            ลิงก์ YouTube *
          </label>
          <input
            v-model="form.youtube_url"
            type="url"
            class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#ea1917] focus:ring-2 focus:ring-[#ea1917]/20"
            placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
          >
          <p v-if="urlInvalid" class="mt-1.5 text-xs text-red-600">
            ลิงก์ไม่ถูกต้อง — ใช้ URL จาก YouTube เท่านั้น
          </p>
          <p v-else class="mt-1.5 text-xs text-gray-500">
            รองรับ youtube.com/watch, youtu.be, /embed/, /shorts/
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">
            หัวข้อบนหน้าแรก
          </label>
          <input
            v-model="form.title"
            type="text"
            maxlength="120"
            class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#ea1917] focus:ring-2 focus:ring-[#ea1917]/20"
            placeholder="วิดีโอจาก LG Subscribe"
          >
        </div>

        <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <input
            v-model="form.is_active"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-[#ea1917] focus:ring-[#ea1917]"
          >
          <span class="text-sm text-gray-800">
            แสดงบนหน้าแรก
          </span>
        </label>

        <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <input
            v-model="form.autoplay"
            type="checkbox"
            class="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#ea1917] focus:ring-[#ea1917]"
          >
          <span class="text-sm text-gray-800">
            Autoplay (เล่นอัตโนมัติพร้อมเสียง)
            <span class="mt-0.5 block text-xs font-normal text-gray-500">
              พยายามเล่นพร้อมเสียงทันที — บางเบราว์เซอร์อาจให้แตะ «เปิดเสียง» ครั้งแรก
            </span>
          </span>
        </label>

        <div v-if="form.autoplay" class="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
          <label class="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
            <span>ระดับเสียงเริ่มต้น</span>
            <span class="tabular-nums text-[#ea1917]">{{ form.default_volume }}%</span>
          </label>
          <input
            v-model.number="form.default_volume"
            type="range"
            min="10"
            max="100"
            step="5"
            class="w-full accent-[#ea1917]"
          >
          <p class="mt-1.5 text-xs text-gray-500">
            แนะนำ 30–50% — ไม่ดังเกินไปเมื่อเข้าหน้าแรก
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            class="inline-flex items-center gap-2 rounded-xl bg-[#ea1917] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d41715] disabled:opacity-60"
            :disabled="saving"
          >
            <Icon v-if="saving" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
            บันทึก
          </button>
          <p v-if="saveMessage" class="text-sm font-medium text-emerald-700">
            {{ saveMessage }}
          </p>
          <p v-if="saveError" class="text-sm text-red-600">
            {{ saveError }}
          </p>
        </div>

        <p v-if="settings?.updated_at" class="text-xs text-gray-400">
          อัปเดตล่าสุด {{ new Date(settings.updated_at).toLocaleString('th-TH') }}
        </p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="text-sm font-semibold text-gray-900">
          ตัวอย่าง
        </h2>
        <p class="mt-1 text-xs text-gray-500">
          แสดงเมื่อเปิด «แสดงบนหน้าแรก» และลิงก์ถูกต้อง
        </p>

        <div v-if="previewVideoId" class="mt-4">
          <p class="mb-3 text-center text-base font-bold text-gray-900">
            {{ form.title || 'วิดีโอจาก LG Subscribe' }}
          </p>
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-black">
            <ClientOnly>
              <HomeYoutubePlayer
                :key="`${previewVideoId}-${form.autoplay}-${form.default_volume}`"
                :video-id="previewVideoId"
                :title="form.title"
                :autoplay="form.autoplay"
                :volume="form.default_volume"
              />
            </ClientOnly>
          </div>
          <a
            v-if="previewWatchUrl"
            :href="previewWatchUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#ea1917] hover:underline"
          >
            เปิดบน YouTube
          </a>
        </div>
        <div
          v-else
          class="mt-4 flex aspect-video items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500"
        >
          ใส่ลิงก์ YouTube เพื่อดูตัวอย่าง
        </div>
      </div>
    </form>
  </div>
</template>
