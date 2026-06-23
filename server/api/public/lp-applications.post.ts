import type { LpApplicationInput } from '~~/shared/types/lpApplication'
import { validateLpApplicationForm } from '~~/shared/utils/lpApplicationForm'
import { isLineConfigured, parseNotifyUserIds, sendLinePush } from '~~/server/utils/lineMessaging'
import { buildLpApplicationLineSummary } from '~~/shared/utils/lpApplicationLineSummary'

export default defineEventHandler(async (event) => {
  const body = await readBody<LpApplicationInput>(event)
  const validated = validateLpApplicationForm(body)

  if (!validated.ok) {
    throw createError({ statusCode: 400, message: validated.message })
  }

  const { questionnaire, ...contact } = validated.data
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('lp_applications')
    .insert({
      first_name: contact.first_name,
      last_name: contact.last_name,
      contact_phone: contact.contact_phone,
      email: contact.email,
      line_id: contact.line_id,
      province: contact.province,
      preferred_contact_time: contact.preferred_contact_time,
      questionnaire,
      status: 'new',
    })
    .select('id')
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  const lineSummary = buildLpApplicationLineSummary({
    ...contact,
    questionnaire,
  })

  if (isLineConfigured()) {
    const pushText = [
      '👔 ใบสมัคร LP (Lifestyle Planner) ใหม่',
      lineSummary,
      '',
      `รหัสใบสมัคร: ${data.id}`,
      'ดูในแอดมิน: /admin/lp-applications',
    ].join('\n')
    void sendLinePush(parseNotifyUserIds(), pushText)
  }

  return { id: data.id }
})
