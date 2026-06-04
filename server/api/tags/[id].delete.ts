import { assertTagCanDelete, fetchTagRowById } from '~~/server/utils/systemTags'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()
  const tag = await fetchTagRowById(supabase, id)
  if (!tag) throw createError({ statusCode: 404, message: 'ไม่พบ Tag' })
  assertTagCanDelete(tag)

  const { error } = await supabase.from('tags').delete().eq('id', id)

  if (error) throw createError({ statusCode: 400, message: error.message })
  return { success: true }
})
