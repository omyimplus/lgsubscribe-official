import {
  collectProductStoragePaths,
  removeStoragePaths,
} from '~~/server/utils/importAssetStorage'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ categoryId?: string }>(event)
  const categoryId = body.categoryId?.trim()
  if (!categoryId) {
    throw createError({ statusCode: 400, message: 'ต้องระบุ categoryId' })
  }

  const supabase = useSupabaseAdmin()

  const { data: category, error: catErr } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('id', categoryId)
    .maybeSingle()

  if (catErr) throw createError({ statusCode: 500, message: catErr.message })
  if (!category?.id) {
    throw createError({ statusCode: 400, message: 'ไม่พบหมวดหมู่ที่เลือก' })
  }

  const { data: productRows, error: listErr } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', category.id)

  if (listErr) throw createError({ statusCode: 500, message: listErr.message })

  const productIds = (productRows ?? []).map(row => row.id)
  if (!productIds.length) {
    return {
      categoryName: category.name,
      deleted: 0,
      storage: { removedFiles: 0, errors: [] as string[] },
    }
  }

  const storagePaths = await collectProductStoragePaths(supabase, productIds)

  await supabase.from('product_tags').delete().in('product_id', productIds)

  const { error: deleteErr } = await supabase.from('products').delete().in('id', productIds)
  if (deleteErr) throw createError({ statusCode: 500, message: deleteErr.message })

  const storage = await removeStoragePaths(supabase, storagePaths)

  return {
    categoryName: category.name,
    deleted: productIds.length,
    storage,
  }
})
