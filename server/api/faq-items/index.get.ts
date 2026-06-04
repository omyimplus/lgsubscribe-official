import { mapFaqItemRow } from '~~/server/utils/faqItemDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(row => mapFaqItemRow(row))
})
