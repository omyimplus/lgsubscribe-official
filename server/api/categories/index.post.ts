import type { CategoryInput } from '~~/shared/types/category'

export default defineEventHandler(async (event) => {
  const body = await readBody<CategoryInput>(event)

  if (!body.name?.trim() || !body.slug?.trim()) {
    throw createError({ statusCode: 400, message: 'name และ slug จำเป็นต้องมี' })
  }
  if (!body.main_category_id) {
    throw createError({ statusCode: 400, message: 'ต้องเลือก main category' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: body.name.trim(),
      slug: body.slug.trim(),
      main_category_id: body.main_category_id,
      icon: body.icon ?? null,
      description: body.description ?? null,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select(`
      *,
      main_category:main_categories ( id, name, slug )
    `)
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
