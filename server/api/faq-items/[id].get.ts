import { mapFaqItemRow } from '~~/server/utils/faqItemDb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) throw createError({ statusCode: 404, message: 'ไม่พบแท็บ FAQ' })
  return mapFaqItemRow(data)
})
