import type { FaqItemInput } from '~~/shared/types/faqItem'
import { mapFaqItemRow } from '~~/server/utils/faqItemDb'
import { sanitizeLgHtml } from '~~/server/utils/sanitizeLgHtml'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<Partial<FaqItemInput>>(event)
  const patch: Record<string, unknown> = {}

  if (body.tab_title !== undefined) patch.tab_title = body.tab_title.trim()
  if (body.body_html !== undefined) {
    patch.body_html = body.body_html ? sanitizeLgHtml(body.body_html, 'standard') : null
  }
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order
  if (body.is_active !== undefined) patch.is_active = body.is_active

  if (!Object.keys(patch).length) {
    throw createError({ statusCode: 400, message: 'ไม่มีข้อมูลที่จะอัปเดต' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('faq_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return mapFaqItemRow(data)
})
