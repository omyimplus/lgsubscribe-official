import { uploadEditorMediaToStorage } from '~~/server/utils/editorMediaStorage'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file')

  if (!file?.data || !file.filename) {
    throw createError({ statusCode: 400, message: 'ไม่พบไฟล์ที่อัปโหลด' })
  }

  const supabase = useSupabaseAdmin()
  return await uploadEditorMediaToStorage(supabase, {
    data: file.data,
    filename: file.filename,
    type: file.type,
  })
})
