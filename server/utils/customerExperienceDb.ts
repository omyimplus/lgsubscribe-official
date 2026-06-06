import type {
  CustomerExperience,
  CustomerExperienceCategory,
} from '~~/shared/types/customerExperience'
import {
  customerExperienceGalleryUrls,
  normalizeCustomerExperienceImageUrls,
  primaryCustomerExperienceImage,
} from '~~/shared/utils/customerExperienceImages'

export function syncCustomerExperienceImageFields(urls: string[]) {
  const image_urls = normalizeCustomerExperienceImageUrls(urls)
  return {
    image_urls,
    image_url: image_urls[0] ?? null,
  }
}

type CategoryLinkRow = {
  category?: CustomerExperienceCategory | CustomerExperienceCategory[] | null
}

function extractCustomerExperienceCategories(row: Record<string, unknown>): CustomerExperienceCategory[] {
  const links = row.customer_experience_categories as CategoryLinkRow[] | undefined
  if (!Array.isArray(links)) return []

  const categories: CustomerExperienceCategory[] = []
  for (const link of links) {
    const raw = link.category
    const category = Array.isArray(raw) ? raw[0] : raw
    if (category?.id && category.name && category.slug) {
      categories.push({ id: category.id, name: category.name, slug: category.slug })
    }
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name, 'th'))
}

export function mapCustomerExperienceRow<T extends Record<string, unknown>>(row: T) {
  const legacyUrl = typeof row.image_url === 'string' ? row.image_url : null
  const image_urls = customerExperienceGalleryUrls(row.image_urls, legacyUrl)
  const image_url = primaryCustomerExperienceImage(image_urls, legacyUrl)
  const categories = extractCustomerExperienceCategories(row)
  const { customer_experience_categories: _links, ...rest } = row

  return {
    ...rest,
    image_urls,
    image_url,
    categories,
  } as T & CustomerExperience
}

export const customerExperienceCategoriesSelect = `
  customer_experience_categories (
    category:categories ( id, name, slug )
  )
`

export const customerExperienceListSelect = `
  id,
  title,
  description,
  image_url,
  image_urls,
  event_date,
  sort_order,
  is_active,
  created_at,
  updated_at,
  ${customerExperienceCategoriesSelect}
`

export const customerExperiencePublicSelect = `
  id,
  title,
  description,
  image_url,
  image_urls,
  event_date,
  sort_order
`

export async function syncCustomerExperienceCategories(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  experienceId: string,
  categoryIds?: string[],
) {
  await supabase
    .from('customer_experience_categories')
    .delete()
    .eq('experience_id', experienceId)

  const ids = [...new Set((categoryIds ?? []).map(id => id.trim()).filter(Boolean))]
  if (!ids.length) return

  const rows = ids.map(category_id => ({ experience_id: experienceId, category_id }))
  const { error } = await supabase.from('customer_experience_categories').insert(rows)
  if (error) throw error
}

export async function fetchCustomerExperienceById(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  id: string,
) {
  const { data, error } = await supabase
    .from('customer_experiences')
    .select(customerExperienceListSelect)
    .eq('id', id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) throw createError({ statusCode: 404, message: 'ไม่พบรายการ' })
  return mapCustomerExperienceRow(data)
}
