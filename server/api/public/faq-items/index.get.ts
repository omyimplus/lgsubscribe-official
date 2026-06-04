import { mapFaqItemRow } from '~~/server/utils/faqItemDb'

/** แท็บ FAQ ที่เปิดใช้งาน — เรียง sort_order */
export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('faq_items')
    .select('id, tab_title, body_html, sort_order, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(row => mapFaqItemRow(row))
})
