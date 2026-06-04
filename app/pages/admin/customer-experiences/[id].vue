<script setup lang="ts">
import type { CustomerExperience, CustomerExperienceInput } from '~~/shared/types/customerExperience'
import { customerExperienceImageSrc } from '~~/shared/utils/customerExperienceDisplay'
import {
  CUSTOMER_EXPERIENCE_MAX_IMAGES,
  customerExperienceGalleryUrls,
} from '~~/shared/utils/customerExperienceImages'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const id = route.params.id as string

const { data: item, pending, error: fetchError, refresh } = await useFetch<CustomerExperience>(
  () => `/api/customer-experiences/${id}`,
  { key: `customer-experience-admin-${id}` },
)

const form = reactive({
  title: '',
  description: '',
  image_urls: [] as string[],
  event_date: '',
  sort_order: 0,
  is_active: true,
})

const imagesDirty = ref(false)
const imagePreviewKey = ref(0)
const selectedImage = ref('')

watch(item, (row) => {
  if (!row) return
  form.title = row.title
  form.description = row.description ?? ''
  if (!imagesDirty.value) {
    form.image_urls = [...customerExperienceGalleryUrls(row.image_urls, row.image_url)]
    imagePreviewKey.value++
    if (!form.image_urls.includes(selectedImage.value)) {
      selectedImage.value = form.image_urls[0] ?? ''
    }
  }
  form.event_date = row.event_date ?? ''
  form.sort_order = row.sort_order
  form.is_active = row.is_active
}, { immediate: true })

watch(
  () => form.image_urls,
  (urls) => {
    if (!urls.length) {
      selectedImage.value = ''
      return
    }
    if (!urls.includes(selectedImage.value)) {
      selectedImage.value = urls[0] ?? ''
    }
  },
  { deep: true },
)

const saving = ref(false)
const formError = ref('')

const imagePreviewSrc = computed(() =>
  customerExperienceImageSrc(selectedImage.value, String(imagePreviewKey.value)),
)

const uploadingImage = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)
const dragOverZone = ref(false)

function triggerImageInput() {
  if (imageInput.value) imageInput.value.value = ''
  imageInput.value?.click()
}

async function uploadFiles(files: FileList | File[]) {
  const list = [...files].filter(f => f.type.startsWith('image/'))
  if (!list.length) return

  const slotsLeft = CUSTOMER_EXPERIENCE_MAX_IMAGES - form.image_urls.length
  if (slotsLeft <= 0) {
    formError.value = `อัปโหลดได้สูงสุด ${CUSTOMER_EXPERIENCE_MAX_IMAGES} รูป`
    return
  }

  uploadingImage.value = true
  formError.value = ''
  try {
    for (const file of list.slice(0, slotsLeft)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('experience_id', id)
      const res = await $fetch<{ url: string }>('/api/customer-experiences/upload-image', {
        method: 'POST',
        body: formData,
      })
      form.image_urls.push(res.url)
    }
    imagesDirty.value = true
    imagePreviewKey.value++
    if (!selectedImage.value && form.image_urls[0]) {
      selectedImage.value = form.image_urls[0]
    }
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'อัพโหลดรูปไม่สำเร็จ'
  }
  finally {
    uploadingImage.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}

async function handleImageUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length) return
  await uploadFiles(files)
}

async function handleImageDrop(e: DragEvent) {
  dragOverZone.value = false
  const files = e.dataTransfer?.files
  if (!files?.length) return
  await uploadFiles(files)
}

function moveImage(index: number, dir: -1 | 1) {
  const next = index + dir
  if (next < 0 || next >= form.image_urls.length) return
  const urls = [...form.image_urls]
  const [removed] = urls.splice(index, 1)
  if (!removed) return
  urls.splice(next, 0, removed)
  form.image_urls = urls
  imagesDirty.value = true
  imagePreviewKey.value++
}

function removeImage(index: number) {
  const removed = form.image_urls[index]
  form.image_urls.splice(index, 1)
  if (selectedImage.value === removed) {
    selectedImage.value = form.image_urls[0] ?? ''
  }
  imagesDirty.value = true
  imagePreviewKey.value++
}

async function handleSave() {
  formError.value = ''
  if (!form.title.trim()) {
    formError.value = 'กรุณาระบุชื่อกิจกรรม'
    return
  }

  saving.value = true
  try {
    const payload: CustomerExperienceInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      image_urls: [...form.image_urls],
      event_date: form.event_date || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    }
    await $fetch(`/api/customer-experiences/${id}`, { method: 'PATCH', body: payload })
    imagesDirty.value = false
    await refresh()
    imagePreviewKey.value++
    alert('บันทึกแล้ว')
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'บันทึกไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!item.value) return
  if (!confirm(`ลบ "${item.value.title}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/customer-experiences/${id}`, { method: 'DELETE' })
    await navigateTo('/admin/customer-experiences')
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="pending" class="py-20 text-center text-gray-400">กำลังโหลด...</div>
    <div v-else-if="fetchError || !item" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      ไม่พบรายการ
    </div>

    <template v-else>
      <AdminPageHeader
        :title="item.title"
        description="อัปโหลดได้หลายรูป — ลำดับรูปแรกจะแสดงก่อนบนการ์ดหน้าแรก"
      >
        <template #actions>
          <NuxtLink
            to="/admin/customer-experiences"
            class="rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            กลับรายการ
          </NuxtLink>
          <button
            type="button"
            class="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            :disabled="saving"
            @click="handleSave"
          >
            {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
        </template>
      </AdminPageHeader>

      <p v-if="formError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{{ formError }}</p>

      <div class="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section class="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อกิจกรรม</label>
            <input v-model="form.title" type="text" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">คำอธิบาย (แสดงใต้การ์ด)</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              placeholder="เช่น งานเปิดตัวสินค้าใหม่ กรุงเทพฯ"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">วันที่จัดกิจกรรม (ไม่บังคับ)</label>
            <input v-model="form.event_date" type="date" class="w-full max-w-xs rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          </div>
        </section>

        <aside class="space-y-4">
          <section class="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
            <h2 class="text-sm font-semibold text-gray-800">รูปกิจกรรม</h2>
            <p class="mt-0.5 text-xs text-gray-500">
              สูงสุด {{ CUSTOMER_EXPERIENCE_MAX_IMAGES }} รูป · แนะนำ 4:3
            </p>

            <div class="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <img
                v-if="selectedImage"
                :src="imagePreviewSrc"
                alt=""
                class="size-full object-cover"
              >
              <div v-else class="flex size-full items-center justify-center text-gray-300">
                <Icon name="heroicons:photo" class="h-10 w-10" />
              </div>
              <div
                v-if="uploadingImage"
                class="absolute inset-0 flex items-center justify-center bg-white/80"
              >
                <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-red-500" />
              </div>
            </div>

            <div v-if="form.image_urls.length" class="mt-3 flex flex-wrap gap-2">
              <div
                v-for="(url, idx) in form.image_urls"
                :key="`${url}-${idx}`"
                class="group relative"
              >
                <button
                  type="button"
                  class="overflow-hidden rounded-lg border p-0.5"
                  :class="selectedImage === url ? 'border-red-500' : 'border-gray-200'"
                  @click="selectedImage = url"
                >
                  <img :src="customerExperienceImageSrc(url)" class="h-14 w-14 object-cover" alt="">
                </button>
                <div class="mt-1 flex justify-center gap-0.5">
                  <button
                    type="button"
                    class="rounded p-0.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                    :disabled="idx === 0"
                    title="เลื่อนซ้าย"
                    @click="moveImage(idx, -1)"
                  >
                    <Icon name="heroicons:chevron-left" class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="rounded p-0.5 text-red-500 hover:bg-red-50"
                    title="ลบรูป"
                    @click="removeImage(idx)"
                  >
                    <Icon name="heroicons:trash" class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="rounded p-0.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                    :disabled="idx === form.image_urls.length - 1"
                    title="เลื่อนขวา"
                    @click="moveImage(idx, 1)"
                  >
                    <Icon name="heroicons:chevron-right" class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div
              class="mt-3 rounded-xl border-2 border-dashed bg-gray-50 p-3 text-center transition"
              :class="dragOverZone ? 'border-red-400 bg-red-50/40' : 'border-gray-300'"
              @dragover.prevent="dragOverZone = true"
              @dragleave.prevent="dragOverZone = false"
              @drop.prevent="handleImageDrop"
            >
              <input
                ref="imageInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                class="hidden"
                @change="handleImageUpload"
              >
              <p class="text-xs font-medium text-gray-700">
                {{ uploadingImage ? 'กำลังอัปโหลด...' : 'ลากรูปมาวาง หรือเลือกหลายไฟล์' }}
              </p>
              <button
                type="button"
                class="mt-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium hover:bg-white disabled:opacity-50"
                :disabled="uploadingImage || form.image_urls.length >= CUSTOMER_EXPERIENCE_MAX_IMAGES"
                @click="triggerImageInput"
              >
                เพิ่มรูป
              </button>
            </div>
            <p class="mt-2 text-xs text-amber-700">
              กด «บันทึก» หลังจัดลำดับหรือเพิ่มรูป
            </p>
          </section>

          <section class="space-y-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">ลำดับ (น้อย = ซ้ายก่อน)</label>
              <input v-model.number="form.sort_order" type="number" min="0" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
            </div>
            <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input v-model="form.is_active" type="checkbox" class="rounded border-gray-300">
              แสดงบนหน้าแรก
            </label>
          </section>

          <button
            type="button"
            class="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            @click="handleDelete"
          >
            ลบรายการ
          </button>
        </aside>
      </div>
    </template>
  </div>
</template>
