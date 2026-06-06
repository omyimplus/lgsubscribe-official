import {
  customerExperiencePublicSelect,
  mapCustomerExperienceRow,
} from '~~/server/utils/customerExperienceDb'

/** กิจกรรมที่เปิดแสดง — ?limit=N สำหรับหน้าแรก, ?category_id= สำหรับ PDP */
export default defineEventHandler(async (event) => {
  const supabase = useSupabaseAdmin()
  const query = getQuery(event)
  const limitRaw = query.limit
  const limit = limitRaw !== undefined && limitRaw !== ''
    ? Math.max(1, Math.min(200, Number(limitRaw) || 0))
    : 0
  const categoryId = typeof query.category_id === 'string' ? query.category_id.trim() : ''

  const select = categoryId
    ? `${customerExperiencePublicSelect}, customer_experience_categories!inner(category_id)`
    : customerExperiencePublicSelect

  let dbQuery = supabase
    .from('customer_experiences')
    .select(select)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('event_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (categoryId) {
    dbQuery = dbQuery.eq('customer_experience_categories.category_id', categoryId)
  }

  if (limit > 0) {
    dbQuery = dbQuery.limit(limit)
  }

  const { data, error } = await dbQuery

  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(row => mapCustomerExperienceRow(row))
})
