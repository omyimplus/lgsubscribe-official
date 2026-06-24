<script setup lang="ts">
const urls = defineModel<string[]>({ required: true })

const props = withDefaults(defineProps<{
  uploadingIndex?: number | null
  disabled?: boolean
}>(), {
  uploadingIndex: null,
  disabled: false,
})

const emit = defineEmits<{
  upload: [index: number, file: File]
  uploadFiles: [files: File[]]
}>()

const dragFromIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const dragOverZone = ref(false)

const isBusy = computed(() => props.disabled || props.uploadingIndex !== null)

function moveSlide(from: number, to: number) {
  const list = [...urls.value]
  if (from < 0 || to < 0 || from >= list.length || to >= list.length || from === to) return
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
  urls.value = list
}

function onSlideDragStart(index: number, event: DragEvent) {
  if (isBusy.value) {
    event.preventDefault()
    return
  }
  dragFromIndex.value = index
  event.dataTransfer?.setData('text/plain', String(index))
  event.dataTransfer!.effectAllowed = 'move'
}

function onSlideDragEnd() {
  dragFromIndex.value = null
  dragOverIndex.value = null
}

function onSlideDragOver(index: number, event: DragEvent) {
  if (dragFromIndex.value === null) return
  event.preventDefault()
  dragOverIndex.value = index
  event.dataTransfer!.dropEffect = 'move'
}

function onSlideDrop(index: number, event: DragEvent) {
  event.preventDefault()
  const from = dragFromIndex.value
  dragFromIndex.value = null
  dragOverIndex.value = null
  if (from === null || from === index) return
  moveSlide(from, index)
}

function removeSlide(index: number) {
  urls.value = urls.value.filter((_, i) => i !== index)
}

function onFileInput(index: number, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  ;(event.target as HTMLInputElement).value = ''
  if (!file) return
  emit('upload', index, file)
}

function collectImageFiles(event: DragEvent): File[] {
  return Array.from(event.dataTransfer?.files ?? []).filter(file =>
    ['image/png', 'image/jpeg', 'image/webp'].includes(file.type),
  )
}

function onZoneDragOver(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('Files') || isBusy.value) return
  event.preventDefault()
  dragOverZone.value = true
}

function onZoneDragLeave() {
  dragOverZone.value = false
}

function onZoneDrop(event: DragEvent) {
  event.preventDefault()
  dragOverZone.value = false
  if (isBusy.value) return
  const files = collectImageFiles(event)
  if (!files.length) return
  emit('uploadFiles', files)
}

function onZoneFileInput(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? [])
  ;(event.target as HTMLInputElement).value = ''
  if (!files.length) return
  emit('uploadFiles', files)
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="(url, index) in urls"
      :key="`${index}-${url}`"
      class="rounded-xl border p-4 transition"
      :class="[
        dragOverIndex === index && dragFromIndex !== null
          ? 'border-[#ea1917] bg-red-50/40'
          : 'border-gray-200',
        dragFromIndex === index ? 'opacity-60' : '',
      ]"
      @dragover="onSlideDragOver(index, $event)"
      @drop="onSlideDrop(index, $event)"
    >
      <div class="mb-2 flex items-center gap-2">
        <button
          type="button"
          class="inline-flex cursor-grab touch-none items-center rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 active:cursor-grabbing"
          :draggable="!isBusy"
          :disabled="isBusy"
          aria-label="ลากเพื่อจัดลำดับ"
          @dragstart="onSlideDragStart(index, $event)"
          @dragend="onSlideDragEnd"
        >
          <Icon name="heroicons:bars-3" class="h-4 w-4" />
        </button>
        <p class="text-xs font-medium text-gray-500">
          รูปที่ {{ index + 1 }}
        </p>
      </div>

      <img
        :src="url"
        :alt="`สไลด์ ${index + 1}`"
        class="aspect-[16/9] w-full rounded-lg border border-gray-100 object-cover"
      >

      <div class="mt-3 flex flex-wrap gap-2">
        <label
          class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          :class="{ 'pointer-events-none opacity-60': isBusy }"
        >
          <Icon
            :name="uploadingIndex === index ? 'heroicons:arrow-path' : 'heroicons:arrow-up-tray'"
            class="h-4 w-4"
            :class="{ 'animate-spin': uploadingIndex === index }"
          />
          เปลี่ยนรูป
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="sr-only"
            :disabled="isBusy"
            @change="onFileInput(index, $event)"
          >
        </label>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          :disabled="isBusy"
          @click="removeSlide(index)"
        >
          <Icon name="heroicons:trash" class="h-4 w-4" />
          ลบ
        </button>
      </div>
    </div>

    <div
      class="rounded-xl border-2 border-dashed px-4 py-10 text-center transition"
      :class="dragOverZone ? 'border-[#ea1917] bg-red-50/40' : 'border-gray-200 hover:border-[#ea1917]/40 hover:bg-red-50/30'"
      @dragover="onZoneDragOver"
      @dragleave.prevent="onZoneDragLeave"
      @drop="onZoneDrop"
    >
      <Icon
        :name="uploadingIndex === urls.length ? 'heroicons:arrow-path' : 'heroicons:photo'"
        class="mx-auto h-10 w-10 text-gray-300"
        :class="{ 'animate-spin text-[#ea1917]': uploadingIndex === urls.length }"
      />
      <p class="mt-2 text-sm font-medium text-gray-700">
        ลากรูปมาวาง หรือเลือกไฟล์
      </p>
      <p class="mt-1 text-xs text-gray-500">
        PNG, JPG, WEBP — ลากการ์ดด้านบนเพื่อจัดลำดับ
      </p>
      <label
        class="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        :class="{ 'pointer-events-none opacity-60': isBusy }"
      >
        เพิ่มรูปสไลด์
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          class="sr-only"
          :disabled="isBusy"
          @change="onZoneFileInput"
        >
      </label>
    </div>
  </div>
</template>
