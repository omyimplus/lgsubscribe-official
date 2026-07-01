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
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

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

function onThumbDragStart(index: number, e: DragEvent) {
  draggedIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

function onThumbDragOver(index: number, e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverIndex.value = index
}

function onThumbDragLeave(index: number) {
  if (dragOverIndex.value === index) dragOverIndex.value = null
}

function onThumbDrop(index: number, e: DragEvent) {
  e.preventDefault()
  const from = draggedIndex.value
  if (from != null && from !== index) moveImage(from, index)
  draggedIndex.value = null
  dragOverIndex.value = null
}

function onThumbDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}

function handleRemove(index: number) {
  const url = galleryUrls.value[index]
  removeImage(index)
  if (selectedImage.value === url) {
    selectedImage.value = galleryUrls.value[0] ?? ''
  }
}
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

    <div v-if="galleryUrls.length" class="mb-4">
      <p class="mb-2 text-xs text-gray-500">
        ลากเพื่อเรียงลำดับ · รูปแรกคือรูปหลัก · คลิกรูปเพื่อดูตัวอย่าง
      </p>
      <div class="grid grid-cols-5 gap-2">
        <div
          v-for="(url, idx) in galleryUrls"
          :key="`${url}-${idx}`"
          class="group relative"
          :class="dragOverIndex === idx && draggedIndex !== idx ? 'z-10' : ''"
          draggable="true"
          @dragstart="onThumbDragStart(idx, $event)"
          @dragover="onThumbDragOver(idx, $event)"
          @dragleave="onThumbDragLeave(idx)"
          @drop="onThumbDrop(idx, $event)"
          @dragend="onThumbDragEnd"
        >
          <button
            type="button"
            class="relative w-full overflow-hidden rounded-xl border-2 bg-white p-1 transition"
            :class="[
              selectedImage === url ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200',
              dragOverIndex === idx && draggedIndex !== idx ? 'border-red-400 bg-red-50/40' : '',
              draggedIndex === idx ? 'opacity-40' : '',
            ]"
            @click="selectedImage = url"
          >
            <img :src="url" class="aspect-square w-full object-contain" :alt="`${form.name}-${idx + 1}`">
            <span
              v-if="idx === 0"
              class="absolute left-1 top-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white"
            >
              หลัก
            </span>
            <span
              class="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
            >
              <Icon name="heroicons:bars-3" class="h-3 w-3" />
              ลาก
            </span>
          </button>
          <button
            type="button"
            class="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 shadow-sm opacity-0 transition hover:bg-red-50 group-hover:opacity-100"
            title="ลบรูป"
            @click.stop="handleRemove(idx)"
          >
            <Icon name="heroicons:x-mark" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
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
  </section>
</template>
