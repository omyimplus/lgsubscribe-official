export default defineEventHandler(async (event) => {
  const body = await readBody<{ batchId?: string }>(event)
  const supabase = useSupabaseAdmin()

  let batchId = body.batchId
  if (!batchId) {
    const { data: latest } = await supabase
      .from('import_batches')
      .select('id')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    batchId = latest?.id
  }

  if (!batchId) throw createError({ statusCode: 400, message: 'ไม่พบ draft batch สำหรับยืนยัน' })

  const { data, error } = await supabase.rpc('promote_import_batch', { p_batch_id: batchId })
  if (error) throw createError({ statusCode: 400, message: error.message })

  return data
})
