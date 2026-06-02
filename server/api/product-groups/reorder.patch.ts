export default defineEventHandler(async (event) => {
  const body = await readBody<{ ids?: string[] }>(event)
  const ids = body.ids

  if (!ids?.length) {
    throw createError({ statusCode: 400, message: 'ต้องส่ง ids' })
  }

  const supabase = useSupabaseAdmin()

  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase
      .from('product_groups')
      .update({ sort_order: i })
      .eq('id', ids[i])

    if (error) throw createError({ statusCode: 400, message: error.message })
  }

  return { ok: true, count: ids.length }
})
