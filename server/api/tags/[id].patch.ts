import type { TagInput } from '~~/shared/types/tag'
import { fetchTagRowById, filterSystemTagPatchBody } from '~~/server/utils/systemTags'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<Partial<TagInput>>(event)
  const supabase = useSupabaseAdmin()
  const existing = await fetchTagRowById(supabase, id)
  if (!existing) throw createError({ statusCode: 404, message: 'ไม่พบ Tag' })

  const patch = filterSystemTagPatchBody(existing, body as Record<string, unknown>)

  const { data, error } = await supabase
    .from('tags')
    .update({
      ...(patch.name !== undefined && { name: String(patch.name).trim() }),
      ...(patch.slug !== undefined && { slug: String(patch.slug).trim() }),
      ...(patch.color !== undefined && { color: patch.color }),
      ...(patch.sort_order !== undefined && { sort_order: patch.sort_order }),
      ...(patch.is_active !== undefined && { is_active: patch.is_active }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data
})
