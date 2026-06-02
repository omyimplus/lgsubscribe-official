import {
  collectProductStoragePaths,
  removeStoragePaths,
} from '~~/server/utils/importAssetStorage'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()

  const storagePaths = await collectProductStoragePaths(supabase, [id])

  await supabase.from('product_tags').delete().eq('product_id', id)

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw createError({ statusCode: 400, message: error.message })

  const storage = await removeStoragePaths(supabase, storagePaths)

  return { success: true, storage }
})
