export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')

  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'ไม่พบไฟล์' })
  }

  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  if (file.type && !allowed.includes(file.type)) {
    throw createError({ statusCode: 400, message: 'รองรับเฉพาะ PNG, JPG, WEBP, SVG' })
  }

  // จำกัด 2MB
  if (file.data.length > 2 * 1024 * 1024) {
    throw createError({ statusCode: 400, message: 'ขนาดไฟล์ห้ามเกิน 2MB' })
  }

  const ext = (file.filename?.split('.').pop() || 'png').toLowerCase()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const supabase = useSupabaseAdmin()
  const { error } = await supabase.storage
    .from('category-icons')
    .upload(path, file.data, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw createError({ statusCode: 400, message: error.message })

  const { data } = supabase.storage.from('category-icons').getPublicUrl(path)
  return { url: data.publicUrl, path }
})
