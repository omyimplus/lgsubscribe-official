import type { ProductGroupPatch } from '~~/shared/types/product'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<ProductGroupPatch>(event)
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('product_groups')
    .update({
      ...(body.display_name !== undefined && { display_name: body.display_name.trim() }),
      ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
    })
    .eq('id', id)
    .select(`
      *,
      category:categories ( id, name, slug )
    `)
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
