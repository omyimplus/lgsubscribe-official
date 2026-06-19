import {
  collectProductStoragePaths,
  removeStoragePaths,
} from '~~/server/utils/importAssetStorage'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ productIds?: string[] }>(event)
  const productIds = [...new Set(
    (body.productIds ?? [])
      .map(id => (typeof id === 'string' ? id.trim() : ''))
      .filter(Boolean),
  )]

  if (!productIds.length) {
    throw createError({ statusCode: 400, message: 'ต้องระบุ productIds อย่างน้อย 1 รายการ' })
  }

  const supabase = useSupabaseAdmin()

  const { data: productRows, error: listErr } = await supabase
    .from('products')
    .select('id')
    .in('id', productIds)

  if (listErr) throw createError({ statusCode: 500, message: listErr.message })

  const existingIds = (productRows ?? []).map(row => row.id)
  if (!existingIds.length) {
    return {
      deleted: 0,
      storage: { removedFiles: 0, errors: [] as string[] },
    }
  }

  const storagePaths = await collectProductStoragePaths(supabase, existingIds)

  await supabase.from('product_tags').delete().in('product_id', existingIds)

  const { error: deleteErr } = await supabase.from('products').delete().in('id', existingIds)
  if (deleteErr) throw createError({ statusCode: 500, message: deleteErr.message })

  const storage = await removeStoragePaths(supabase, storagePaths)

  return {
    deleted: existingIds.length,
    storage,
  }
})
