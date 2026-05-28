import type { TagInput } from '~~/shared/types/tag'

export default defineEventHandler(async (event) => {
  const body = await readBody<TagInput>(event)

  if (!body.name?.trim() || !body.slug?.trim()) {
    throw createError({ statusCode: 400, message: 'name และ slug จำเป็นต้องมี' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('tags')
    .insert({
      name: body.name.trim(),
      slug: body.slug.trim(),
      color: body.color ?? '#dc2626',
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
