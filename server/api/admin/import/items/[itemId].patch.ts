const DETAIL_FIELDS = [
  'key_features',
  'features',
  'specifications',
  'faq_html',
] as const

type DetailField = (typeof DETAIL_FIELDS)[number]

export default defineEventHandler(async (event) => {
  const itemId = getRouterParam(event, 'itemId')
  if (!itemId) throw createError({ statusCode: 400, message: 'ต้องระบุ item id' })

  const body = await readBody<Partial<Record<DetailField, string | null>>>(event)
  const updates: Partial<Record<DetailField, string | null>> = {}

  for (const field of DETAIL_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] = body[field] || null
    }
  }

  if (!Object.keys(updates).length) {
    throw createError({ statusCode: 400, message: 'ไม่มีฟิลด์ที่อัปเดต' })
  }

  const supabase = useSupabaseAdmin()

  const { data: existing, error: fetchErr } = await supabase
    .from('import_products')
    .select('*')
    .eq('id', itemId)
    .single()

  if (fetchErr || !existing) {
    throw createError({ statusCode: 404, message: fetchErr?.message ?? 'ไม่พบรายการ import' })
  }

  const { data: batch, error: batchErr } = await supabase
    .from('import_batches')
    .select('status')
    .eq('id', existing.batch_id)
    .single()

  if (batchErr || !batch) {
    throw createError({ statusCode: 404, message: 'ไม่พบ batch ของรายการนี้' })
  }

  if (batch.status !== 'draft') {
    throw createError({ statusCode: 400, message: 'แก้ไขได้เฉพาะรายการใน draft' })
  }

  const { data, error } = await supabase
    .from('import_products')
    .update(updates)
    .eq('id', itemId)
    .select('*')
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
