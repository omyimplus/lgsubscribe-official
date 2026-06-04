import type { CustomerExperienceInput } from '~~/shared/types/customerExperience'
import { mapCustomerExperienceRow, syncCustomerExperienceImageFields } from '~~/server/utils/customerExperienceDb'
import { normalizeCustomerExperienceImageUrls } from '~~/shared/utils/customerExperienceImages'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<Partial<CustomerExperienceInput>>(event)
  const patch: Record<string, unknown> = {}

  if (body.title !== undefined) {
    const title = body.title.trim()
    if (!title) throw createError({ statusCode: 400, message: 'ชื่อกิจกรรมต้องไม่ว่าง' })
    patch.title = title
  }
  if (body.description !== undefined) patch.description = body.description?.trim() || null
  if (body.image_urls !== undefined) {
    Object.assign(patch, syncCustomerExperienceImageFields(body.image_urls))
  }
  else if (body.image_url !== undefined) {
    const single = body.image_url?.trim()
    Object.assign(patch, syncCustomerExperienceImageFields(single ? [single] : []))
  }
  if (body.event_date !== undefined) patch.event_date = body.event_date || null
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order
  if (body.is_active !== undefined) patch.is_active = body.is_active

  if (!Object.keys(patch).length) {
    throw createError({ statusCode: 400, message: 'ไม่มีข้อมูลที่จะอัปเดต' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('customer_experiences')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return mapCustomerExperienceRow(data)
})
