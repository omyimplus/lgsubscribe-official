import type { CustomerExperienceInput } from '~~/shared/types/customerExperience'
import {
  fetchCustomerExperienceById,
  syncCustomerExperienceCategories,
  syncCustomerExperienceImageFields,
} from '~~/server/utils/customerExperienceDb'
import { normalizeCustomerExperienceImageUrls } from '~~/shared/utils/customerExperienceImages'

export default defineEventHandler(async (event) => {
  const body = await readBody<CustomerExperienceInput>(event)

  if (!body.title?.trim()) {
    throw createError({ statusCode: 400, message: 'ต้องระบุชื่อกิจกรรม' })
  }

  const images = body.image_urls !== undefined
    ? normalizeCustomerExperienceImageUrls(body.image_urls)
    : (body.image_url?.trim() ? [body.image_url.trim()] : [])
  const { image_url, image_urls } = syncCustomerExperienceImageFields(images)

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('customer_experiences')
    .insert({
      title: body.title.trim(),
      description: body.description?.trim() || null,
      image_url,
      image_urls,
      event_date: body.event_date || null,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  if (body.category_ids?.length) {
    await syncCustomerExperienceCategories(supabase, data.id, body.category_ids)
  }

  return fetchCustomerExperienceById(supabase, data.id)
})
