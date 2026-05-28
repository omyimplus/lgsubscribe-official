import type { TagInput } from '~~/shared/types/tag'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<Partial<TagInput>>(event)
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('tags')
    .update({
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.slug !== undefined && { slug: body.slug.trim() }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
