export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')
  const experienceId = form?.find(f => f.name === 'experience_id')?.data?.toString()?.trim()

  if (!file?.data) {
    throw createError({ statusCode: 400, message: 'ไม่พบไฟล์' })
  }

  const allowed = ['image/png', 'image/jpeg', 'image/webp']
  if (file.type && !allowed.includes(file.type)) {
    throw createError({ statusCode: 400, message: 'รองรับเฉพาะ PNG, JPG, WEBP' })
  }

  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, message: 'ขนาดไฟล์ห้ามเกิน 5MB' })
  }

  const ext = (file.filename?.split('.').pop() || 'jpg').toLowerCase()
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const path = experienceId
    ? `customer-experiences/${experienceId}/${stamp}.${ext}`
    : `customer-experiences/${stamp}.${ext}`

  const supabase = useSupabaseAdmin()
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file.data, { contentType: file.type, upsert: true })

  if (error) throw createError({ statusCode: 400, message: error.message })

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return { url: data.publicUrl, path }
})
