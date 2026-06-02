<script setup lang="ts">
import { PRODUCT_FORM_KEY } from './form-context'

const ctx = inject(PRODUCT_FORM_KEY)
if (!ctx) throw new Error('ProductFormGallery must be used inside product form page')

const {
  form,
  btnSecondaryClass,
  uploadingImage,
  dragOverImageZone,
  fileInput,
  triggerFileInput,
  handleImageUpload,
  handleImageDrop,
  moveImage,
  removeImage,
} = ctx

const selectedImage = ref('')

watch(
  () => form.image_urls,
  (urls) => {
    const list = urls?.length ? urls : (form.image_url ? [form.image_url] : [])
    if (!list.length) {
      selectedImage.value = ''
      return
    }
    if (!list.includes(selectedImage.value)) {
      selectedImage.value = list[0] ?? ''
    }
  },
  { immediate: true, deep: true },
)

const galleryUrls = computed(() => {
  if (form.image_urls?.length) return form.image_urls
  return form.image_url ? [form.image_url] : []
})
</script>

<template>
  <section>
    <div class="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4">
      <img
        v-if="selectedImage || form.image_url"
        :src="selectedImage || form.image_url || ''"
        class="h-[360px] w-full object-contain"
        :alt="form.name || 'product'"
      >
      <div v-else class="flex h-[360px] items-center justify-center text-sm text-gray-400">
        ยังไม่มีรูป
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="(url, idx) in galleryUrls"
        :key="`${url}-${idx}`"
        type="button"
        class="overflow-hidden rounded-lg border p-1"
        :class="selectedImage === url ? 'border-red-500' : 'border-gray-200'"
        @click="selectedImage = url"
      >
        <img :src="url" class="h-16 w-16 object-contain" :alt="`${form.name}-${idx + 1}`">
      </button>
    </div>

    <div
      class="rounded-xl border-2 border-dashed bg-gray-50 p-4 text-center transition"
      :class="dragOverImageZone ? 'border-red-400 bg-red-50/40' : 'border-gray-300'"
      @dragover.prevent="dragOverImageZone = true"
      @dragleave.prevent="dragOverImageZone = false"
      @drop="handleImageDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        class="hidden"
        @change="handleImageUpload"
      >
      <p class="text-sm font-medium text-gray-700">
        {{ uploadingImage ? 'กำลังอัปโหลด...' : 'ลากรูปมาวาง หรือเลือกไฟล์' }}
      </p>
      <button type="button" :class="['mt-3', btnSecondaryClass]" :disabled="uploadingImage" @click="triggerFileInput">
        เลือกรูปภาพ
      </button>
    </div>

    <div v-if="form.image_urls?.length" class="mt-3 space-y-2">
      <div
        v-for="(url, idx) in form.image_urls"
        :key="`${url}-${idx}`"
        class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 text-xs"
      >
        <span class="min-w-0 flex-1 truncate text-gray-500">{{ url }}</span>
        <span v-if="idx === 0" class="font-semibold text-red-600">รูปหลัก</span>
        <button type="button" class="rounded p-1 hover:bg-gray-100" :disabled="idx === 0" @click="moveImage(idx, idx - 1)">
          <Icon name="heroicons:arrow-up" class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="rounded p-1 hover:bg-gray-100"
          :disabled="idx === form.image_urls.length - 1"
          @click="moveImage(idx, idx + 1)"
        >
          <Icon name="heroicons:arrow-down" class="h-4 w-4" />
        </button>
        <button type="button" class="rounded p-1 text-red-500 hover:bg-red-50" @click="removeImage(idx)">
          <Icon name="heroicons:trash" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </section>
</template>
