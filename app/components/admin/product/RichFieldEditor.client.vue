<script setup lang="ts">
import { QuillEditor } from '@vueup/vue-quill'
import 'quill/dist/quill.snow.css'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorRef = ref<InstanceType<typeof QuillEditor> | null>(null)
const content = ref(props.modelValue ?? '')
const editorHasFocus = ref(false)
const uploading = ref(false)
const hiddenFileInput = ref<HTMLInputElement | null>(null)
const uploadKind = ref<'image' | 'video'>('image')

watch(() => props.modelValue, (value) => {
  if (editorHasFocus.value) return
  const next = value ?? ''
  if (next === content.value) return
  content.value = next
})

watch(content, (value) => {
  if (editorHasFocus.value) emit('update:modelValue', value)
})

onMounted(() => {
  const quill = editorRef.value?.getQuill()
  if (!quill) return
  quill.on('selection-change', (range) => {
    editorHasFocus.value = range !== null
  })
  quill.on('text-change', () => {
    if (editorHasFocus.value) emit('update:modelValue', content.value)
  })
})

const toolbar = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ header: [2, 3, false] }],
  ['link', 'clean'],
]

function triggerUpload(kind: 'image' | 'video') {
  uploadKind.value = kind
  if (!hiddenFileInput.value) return
  hiddenFileInput.value.accept = kind === 'image' ? 'image/*' : 'video/*'
  hiddenFileInput.value.click()
}

async function onPickFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await $fetch<{ url: string, type: 'image' | 'video' }>('/api/editor/upload-media', {
      method: 'POST',
      body: fd,
    })

    const quill = editorRef.value?.getQuill()
    if (!quill) return
    const range = quill.getSelection(true)
    const at = range?.index ?? quill.getLength()
    quill.insertEmbed(at, uploadKind.value === 'video' ? 'video' : 'image', res.url, 'user')
    quill.setSelection(at + 1, 0)
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string }, message?: string }
    window.alert(e?.data?.message ?? e?.message ?? 'อัปโหลดไม่สำเร็จ')
  }
  finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        :disabled="uploading"
        @click="triggerUpload('image')"
      >
        {{ uploading && uploadKind === 'image' ? 'กำลังอัปโหลดรูป...' : 'แทรกรูป' }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        :disabled="uploading"
        @click="triggerUpload('video')"
      >
        {{ uploading && uploadKind === 'video' ? 'กำลังอัปโหลดวิดีโอ...' : 'แทรกวิดีโอ' }}
      </button>
      <p class="text-xs text-gray-400">
        อัปโหลดไป Supabase Storage · รูป ≤8MB · วิดีโอ ≤25MB (MP4, WebM, MOV)
      </p>
    </div>

    <input ref="hiddenFileInput" type="file" class="hidden" @change="onPickFile">

    <QuillEditor
      ref="editorRef"
      v-model:content="content"
      content-type="html"
      theme="snow"
      :toolbar="toolbar"
      :placeholder="placeholder ?? 'พิมพ์ข้อมูลที่นี่...'"
    />
  </div>
</template>
