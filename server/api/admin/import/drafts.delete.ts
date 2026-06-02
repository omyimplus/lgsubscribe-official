import {
  collectStoragePathsFromImportRow,
  purgeImportDraftStorage,
} from '~~/server/utils/importAssetStorage'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data: batches, error: listErr } = await supabase
    .from('import_batches')
    .select('id')
    .eq('status', 'draft')

  if (listErr) throw createError({ statusCode: 500, message: listErr.message })
  if (!batches?.length) {
    return { deleted: 0, storage: { removedFiles: 0, skippedProtected: 0, errors: [] } }
  }

  const ids = batches.map(b => b.id)

  const { data: importRows } = await supabase
    .from('import_products')
    .select('image_url, image_urls, description, key_features, features, specifications, faq_html')
    .in('batch_id', ids)

  const storage = await purgeImportDraftStorage(
    supabase,
    ids,
    (importRows ?? []).flatMap(row => collectStoragePathsFromImportRow(row)),
  )

  await supabase.from('import_products').delete().in('batch_id', ids)
  const { error } = await supabase.from('import_batches').delete().in('id', ids)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return {
    deleted: ids.length,
    storage,
  }
})
