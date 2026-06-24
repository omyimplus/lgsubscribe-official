import type { SupabaseClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import { optimizeUploadImageToWebp } from '~~/server/utils/optimizeUploadImage'

const ALLOWED_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_BYTES = 5 * 1024 * 1024

export async function readAdminSlideUploadFile(event: H3Event) {
  let form: Awaited<ReturnType<typeof readMultipartFormData>>
  try {
    form = await readMultipartFormData(event)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'อ่านไฟล์อัปโหลดไม่สำเร็จ'
    throw createError({ statusCode: 400, message: `ไม่สามารถอ่านไฟล์ได้ — ${message}` })
  }

  const file = form?.find(item => item.name === 'file')
  if (!file?.data?.length) {
    throw createError({ statusCode: 400, message: 'ไม่พบไฟล์ — ลองเลือกรูปใหม่อีกครั้ง' })
  }

  const mime = (file.type || '').toLowerCase()
  if (mime && !ALLOWED_IMAGE_MIMES.has(mime)) {
    throw createError({ statusCode: 400, message: 'รองรับเฉพาะ PNG, JPG, WEBP' })
  }

  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, message: 'ขนาดไฟล์ห้ามเกิน 5MB' })
  }

  return file
}

export async function uploadAdminSlideImage(
  supabase: SupabaseClient,
  file: NonNullable<Awaited<ReturnType<typeof readAdminSlideUploadFile>>>,
  storagePrefix: string,
) {
  const optimized = await optimizeUploadImageToWebp(Buffer.from(file.data))
  const normalizedPrefix = storagePrefix.replace(/^\/+|\/+$/g, '')
  const path = `${normalizedPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, optimized, {
      contentType: 'image/webp',
      upsert: true,
    })

  if (error) {
    const message = error.message || 'อัปโหลดไม่สำเร็จ'
    const statusCode = /service unavailable|timeout|fetch failed|network/i.test(message) ? 503 : 400
    throw createError({ statusCode, message })
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return { url: data.publicUrl, path }
}
