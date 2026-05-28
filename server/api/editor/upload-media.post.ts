import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file')

  if (!file?.data || !file.filename) {
    throw createError({ statusCode: 400, message: 'ไม่พบไฟล์ที่อัปโหลด' })
  }

  const mime = file.type || ''
  const isImage = mime.startsWith('image/')
  const isVideo = mime.startsWith('video/')
  if (!isImage && !isVideo) {
    throw createError({ statusCode: 400, message: 'รองรับเฉพาะไฟล์รูปภาพหรือวิดีโอ' })
  }

  const maxBytes = isVideo ? 25 * 1024 * 1024 : 8 * 1024 * 1024
  if (file.data.length > maxBytes) {
    throw createError({
      statusCode: 400,
      message: isVideo ? 'วิดีโอห้ามเกิน 25MB' : 'รูปภาพห้ามเกิน 8MB',
    })
  }

  const safeExt = (extname(file.filename) || (isVideo ? '.mp4' : '.jpg')).toLowerCase()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`
  const saveDir = join(process.cwd(), 'public', 'uploads', 'editor')
  await mkdir(saveDir, { recursive: true })
  await writeFile(join(saveDir, fileName), file.data)

  return {
    url: `/uploads/editor/${fileName}`,
    type: isVideo ? 'video' : 'image',
  }
})
