<script setup lang="ts">
/**
 * WYSIWYG สำหรับ HTML จาก LG (TinyMCE) + ปุ่มแทรกรูป/วิดีโอด้านบน (มองเห็นชัด)
 */
import Editor from '@tinymce/tinymce-vue'

import tinymce from 'tinymce'
import type { Editor as TinyMceEditor } from 'tinymce'

/* TinyMCE 8 + Vite: ต้อง import skin เป็น .js ไม่ใช่ .min.css มิฉะนั้น menubar/toolbar มักไม่แสดง */
import 'tinymce/icons/default/icons.min.js'
import 'tinymce/themes/silver/theme.min.js'
import 'tinymce/models/dom/model.min.js'
import 'tinymce/skins/ui/oxide/skin.js'
import 'tinymce/skins/ui/oxide/content.js'
import 'tinymce/skins/content/default/content.js'

import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/media'
import 'tinymce/plugins/code'
import 'tinymce/plugins/fullscreen'
import 'tinymce/plugins/table'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/help'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const content = ref(repairEditorHtmlImages(props.modelValue ?? ''))
const editorInstanceId = `import-html-editor-${useId()}`
const editorRef = shallowRef<TinyMceEditor | null>(null)
const uploading = ref(false)
const uploadingKind = ref<'image' | 'video' | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)

watch(() => props.modelValue, (value) => {
  const next = repairEditorHtmlImages(value ?? '')
  if (next === content.value) return
  content.value = next
  const editor = editorRef.value ?? tinymce.get(editorInstanceId)
  if (editor && editor.getContent() !== next) {
    editor.setContent(next)
  }
})

watch(content, (value) => {
  emit('update:modelValue', value)
})

function onEditorInit(_evt: unknown, editor: TinyMceEditor) {
  editorRef.value = editor
  const repaired = repairEditorHtmlImages(editor.getContent())
  if (repaired !== editor.getContent()) {
    editor.setContent(repaired)
    content.value = repaired
  }
}

async function uploadEditorMedia(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return await $fetch<{ url: string, type: 'image' | 'video' }>('/api/editor/upload-media', {
    method: 'POST',
    body: formData,
  })
}

function uploadErrorMessage(err: unknown) {
  const e = err as { data?: { message?: string }, message?: string }
  return e?.data?.message ?? e?.message ?? 'อัปโหลดไม่สำเร็จ'
}

function getEditor() {
  return editorRef.value ?? tinymce.get(editorInstanceId) ?? null
}

async function insertUploadedImage(file: File) {
  const editor = getEditor()
  if (!editor) {
    window.alert('รอ editor โหลดเสร็จก่อน แล้วลองอีกครั้ง')
    return
  }
  uploading.value = true
  uploadingKind.value = 'image'
  try {
    const res = await uploadEditorMedia(file)
    editor.insertContent(`<img src="${res.url}" alt="" />`)
    content.value = editor.getContent()
  }
  catch (err) {
    window.alert(uploadErrorMessage(err))
  }
  finally {
    uploading.value = false
    uploadingKind.value = null
  }
}

async function insertUploadedVideo(file: File) {
  const editor = getEditor()
  if (!editor) {
    window.alert('รอ editor โหลดเสร็จก่อน แล้วลองอีกครั้ง')
    return
  }
  uploading.value = true
  uploadingKind.value = 'video'
  try {
    const res = await uploadEditorMedia(file)
    const type = file.type || 'video/mp4'
    editor.insertContent(
      `<video controls width="100%" playsinline><source src="${res.url}" type="${type}" /></video>`,
    )
    content.value = editor.getContent()
  }
  catch (err) {
    window.alert(uploadErrorMessage(err))
  }
  finally {
    uploading.value = false
    uploadingKind.value = null
  }
}

function openImagePicker() {
  imageInput.value?.click()
}

function openVideoPicker() {
  videoInput.value?.click()
}

async function onImagePicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  await insertUploadedImage(file)
}

async function onVideoPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  await insertUploadedVideo(file)
}

const editorInit = {
  license_key: 'gpl',
  height: 520,
  skin_url: 'default',
  content_css: 'default',
  menubar: 'edit view insert format tools table help',
  branding: false,
  promotion: false,
  plugins: 'lists link image media code fullscreen table autolink help',
  /** รูปแบบย่อหน้า — dropdown แรกใน toolbar (เดิมชื่อ blocks) */
  block_formats:
    'ย่อหน้า=p; หัวข้อ H1=h1; หัวข้อ H2=h2; หัวข้อ H3=h3; หัวข้อ H4=h4; หัวข้อ H5=h5; หัวข้อ H6=h6',
  toolbar:
    'undo redo | blocks | bold italic underline strikethrough '
    + '| alignleft aligncenter alignright alignjustify '
    + '| bullist numlist outdent indent | link image media table '
    + '| removeformat | code fullscreen',
  placeholder: 'แก้ไขเนื้อหา...',
  automatic_uploads: true,
  images_upload_handler: (blobInfo: { blob: () => Blob, filename: () => string }) =>
    new Promise<string>((resolve, reject) => {
      const blob = blobInfo.blob()
      const file = new File([blob], blobInfo.filename(), { type: blob.type || 'image/jpeg' })
      uploadEditorMedia(file)
        .then(res => resolve(res.url))
        .catch(err => reject(uploadErrorMessage(err)))
    }),
  extended_valid_elements: '*[*]',
  valid_elements: '*[*]',
  verify_html: false,
  entity_encoding: 'raw',
  convert_urls: false,
  relative_urls: false,
  remove_script_host: false,
  media_live_embeds: true,
  content_style: `
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
    body {
      font-family: "Prompt", ui-sans-serif, system-ui, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #1f2937;
      padding: 8px 12px;
    }
    ul, ol { padding-left: 1.25rem; }
    ul.c-list { list-style: disc; }
    img, video { max-width: 100%; height: auto; }
    h1 { font-size: 1.75rem; font-weight: 700; margin: 1rem 0 0.5rem; }
    h2 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
    h3 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
    h4, h5, h6 { font-weight: 600; margin: 0.75rem 0 0.5rem; }
  `,
}
</script>

<template>
  <div class="import-tinymce-editor space-y-3">
    <div class="rounded-xl border-2 border-red-200 bg-red-50 p-4">
      <p class="mb-3 text-sm font-medium text-gray-800">
        อัปโหลดจากเครื่อง (ใช้ปุ่มด้านล่าง — ไม่ได้อยู่ในเมนูคลิกขวา)
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
          :disabled="uploading"
          @click="openImagePicker"
        >
          {{ uploadingKind === 'image' ? 'กำลังอัปโหลดรูป...' : 'แทรกรูป' }}
        </button>
        <button
          type="button"
          class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
          :disabled="uploading"
          @click="openVideoPicker"
        >
          {{ uploadingKind === 'video' ? 'กำลังอัปโหลดวิดีโอ...' : 'แทรกวิดีโอ' }}
        </button>
      </div>
      <p class="mt-2 text-xs text-gray-500">
        อัปโหลดไป Supabase Storage
        (<span class="font-mono">product-images/editor/…</span>)
        · รูป ≤8MB · วิดีโอ ≤25MB (MP4, WebM, MOV)
        · ใน toolbar: ไอคอนรูป → แท็บ Upload ก็อัปโหลดได้
      </p>
      <p class="mt-1 text-xs text-gray-500">
        จัดรูปแบบข้อความ: dropdown แรกในแถบเครื่องมือ (ย่อหน้า / H1–H6)
        · ตัวหนา/เอียง/ขีดเส้นใต้/ขีดฆ่า ถัดจาก dropdown นั้น
        · เมนู <span class="font-medium">Format</span> ด้านบนมีตัวเลือกเพิ่ม
      </p>
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onImagePicked"
      >
      <input
        ref="videoInput"
        type="file"
        accept="video/*"
        class="hidden"
        @change="onVideoPicked"
      >
    </div>

    <Editor
      :id="editorInstanceId"
      v-model="content"
      license-key="gpl"
      :init="{ ...editorInit, placeholder: props.placeholder ?? editorInit.placeholder }"
      @init="onEditorInit"
    />
  </div>
</template>

<style scoped>
.import-tinymce-editor :deep(.tox-tinymce) {
  border-radius: 0.75rem;
  border-color: rgb(229 231 235);
}

/* Tailwind preflight บางครั้งซ่อน header ของ TinyMCE */
.import-tinymce-editor :deep(.tox:not(.tox-tinymce-inline) .tox-editor-header) {
  display: block;
}

.import-tinymce-editor :deep(.tox-tinymce-aux) {
  z-index: 10050;
}
</style>
