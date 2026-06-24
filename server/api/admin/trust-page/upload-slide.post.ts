import { readAdminSlideUploadFile, uploadAdminSlideImage } from '~~/server/utils/adminSlideUpload'

export default defineEventHandler(async (event) => {
  const file = await readAdminSlideUploadFile(event)
  const supabase = useSupabaseAdmin()
  return await uploadAdminSlideImage(supabase, file, 'trust-page/slides')
})
