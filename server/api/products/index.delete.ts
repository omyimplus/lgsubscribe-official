import {
  collectProductStoragePaths,
  removeStoragePaths,
} from '~~/server/utils/importAssetStorage'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data: rows, error: listErr } = await supabase.from('products').select('id')
  if (listErr) throw createError({ statusCode: 500, message: listErr.message })

  const ids = (rows ?? []).map(row => row.id)
  if (!ids.length) {
    return { deleted: 0, storage: { removedFiles: 0, errors: [] } }
  }

  const storagePaths = await collectProductStoragePaths(supabase)

  await supabase.from('product_tags').delete().in('product_id', ids)

  const { error: deleteErr } = await supabase.from('products').delete().in('id', ids)
  if (deleteErr) throw createError({ statusCode: 500, message: deleteErr.message })

  const storage = await removeStoragePaths(supabase, storagePaths)

  return {
    deleted: ids.length,
    storage,
  }
})
