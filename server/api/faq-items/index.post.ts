import type { FaqItemInput } from '~~/shared/types/faqItem'
import { mapFaqItemRow } from '~~/server/utils/faqItemDb'
import { sanitizeLgHtml } from '~~/server/utils/sanitizeLgHtml'

export default defineEventHandler(async (event) => {
  const body = await readBody<FaqItemInput>(event)

  if (!body.tab_title?.trim()) {
    throw createError({ statusCode: 400, message: 'ต้องระบุชื่อแท็บ' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('faq_items')
    .insert({
      tab_title: body.tab_title.trim(),
      body_html: body.body_html ? sanitizeLgHtml(body.body_html, 'standard') : null,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return mapFaqItemRow(data)
})
