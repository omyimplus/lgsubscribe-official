export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data: batches, error: listErr } = await supabase
    .from('import_batches')
    .select('id')
    .eq('status', 'draft')

  if (listErr) throw createError({ statusCode: 500, message: listErr.message })
  if (!batches?.length) return { deleted: 0 }

  const ids = batches.map(b => b.id)
  await supabase.from('import_products').delete().in('batch_id', ids)
  const { error } = await supabase.from('import_batches').delete().in('id', ids)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { deleted: ids.length }
})
