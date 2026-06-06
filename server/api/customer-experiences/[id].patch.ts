import type { CustomerExperienceInput } from '~~/shared/types/customerExperience'
import {
  fetchCustomerExperienceById,
  syncCustomerExperienceCategories,
  syncCustomerExperienceImageFields,
} from '~~/server/utils/customerExperienceDb'

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

  const supabase = useSupabaseAdmin()

  if (body.category_ids !== undefined) {
    await syncCustomerExperienceCategories(supabase, id, body.category_ids)
  }

  if (!Object.keys(patch).length && body.category_ids === undefined) {
    throw createError({ statusCode: 400, message: 'ไม่มีข้อมูลที่จะอัปเดต' })
  }

  if (Object.keys(patch).length) {
    const { error } = await supabase
      .from('customer_experiences')
      .update(patch)
      .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })
  }

  return fetchCustomerExperienceById(supabase, id)
})
