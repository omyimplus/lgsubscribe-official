import type { CustomerExperience } from '~~/shared/types/customerExperience'
import {
  customerExperienceGalleryUrls,
  primaryCustomerExperienceImage,
} from '~~/shared/utils/customerExperienceImages'

export function syncCustomerExperienceImageFields(urls: string[]) {
  const image_urls = normalizeCustomerExperienceImageUrls(urls)
  return {
    image_urls,
    image_url: image_urls[0] ?? null,
  }
}

export function mapCustomerExperienceRow<T extends Record<string, unknown>>(row: T) {
  const legacyUrl = typeof row.image_url === 'string' ? row.image_url : null
  const image_urls = customerExperienceGalleryUrls(row.image_urls, legacyUrl)
  const image_url = primaryCustomerExperienceImage(image_urls, legacyUrl)

  return {
    ...row,
    image_urls,
    image_url,
  } as T & CustomerExperience
}

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
  updated_at
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
