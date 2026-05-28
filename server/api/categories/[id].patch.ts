import type { CategoryInput } from '~~/shared/types/category'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<Partial<CategoryInput>>(event)
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('categories')
    .update({
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.slug !== undefined && { slug: body.slug.trim() }),
      ...(body.main_category_id !== undefined && { main_category_id: body.main_category_id }),
      ...(body.icon !== undefined && { icon: body.icon }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
    })
    .eq('id', id)
    .select(`
      *,
      main_category:main_categories ( id, name, slug )
    `)
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
