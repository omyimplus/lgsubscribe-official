export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data: batch, error: batchErr } = await supabase
    .from('import_batches')
    .select('*')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (batchErr) throw createError({ statusCode: 500, message: batchErr.message })
  if (!batch) return { batch: null, items: [] }

  const { data: items, error: itemErr } = await supabase
    .from('import_products')
    .select('*')
    .eq('batch_id', batch.id)
    .order('created_at', { ascending: true })

  if (itemErr) throw createError({ statusCode: 500, message: itemErr.message })
  return { batch, items: items ?? [] }
})
