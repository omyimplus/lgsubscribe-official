import type { SupabaseClient } from '@supabase/supabase-js'
import { extname } from 'node:path'

export const EDITOR_MEDIA_BUCKET = 'product-images'
export const EDITOR_IMAGE_PREFIX = 'editor/images/'
export const EDITOR_VIDEO_PREFIX = 'editor/videos/'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_VIDEO_BYTES = 25 * 1024 * 1024

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov'])
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
}

export type EditorMediaUploadInput = {
  data: Uint8Array
  filename: string
  type?: string
}

function detectMediaKind(mime: string, filename: string): 'image' | 'video' | null {
  const normalized = mime.toLowerCase()
  if (ALLOWED_VIDEO_MIMES.has(normalized)) return 'video'
  if (ALLOWED_IMAGE_MIMES.has(normalized)) return 'image'

  const ext = extname(filename).toLowerCase()
  if (VIDEO_EXTENSIONS.has(ext)) return 'video'
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  return null
}

function safeExtension(filename: string, mime: string, fallback: string) {
  const fromName = extname(filename).toLowerCase().replace(/^\./, '')
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName
  return MIME_TO_EXT[mime] ?? fallback
}

function contentTypeFor(kind: 'image' | 'video', mime: string) {
  if (mime) return mime
  return kind === 'video' ? 'video/mp4' : 'image/jpeg'
}

export async function uploadEditorMediaToStorage(
  supabase: SupabaseClient,
  file: EditorMediaUploadInput,
) {
  const mime = (file.type || '').toLowerCase()
  const kind = detectMediaKind(mime, file.filename)

  if (!kind) {
    throw createError({
      statusCode: 400,
      message: 'รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, GIF) หรือวิดีโอ (MP4, WebM, MOV)',
    })
  }

  const maxBytes = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.data.length > maxBytes) {
    throw createError({
      statusCode: 400,
      message: kind === 'video' ? 'วิดีโอห้ามเกิน 25MB' : 'รูปภาพห้ามเกิน 8MB',
    })
  }

  const prefix = kind === 'video' ? EDITOR_VIDEO_PREFIX : EDITOR_IMAGE_PREFIX
  const ext = safeExtension(file.filename, mime, kind === 'video' ? 'mp4' : 'jpg')
  const path = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

  const { error } = await supabase.storage
    .from(EDITOR_MEDIA_BUCKET)
    .upload(path, file.data, {
      contentType: contentTypeFor(kind, mime),
      upsert: false,
    })

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  const { data } = supabase.storage.from(EDITOR_MEDIA_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path, type: kind }
}
