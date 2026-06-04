export const HOME_EXPERIENCES_SECTION_TITLE = 'LG Subscribe Customer Experiences'

export const EXPERIENCES_PAGE_PATH = '/experiences'

/** จำนวนสูงสุดบนหน้าแรก (สไลเดอร์) */
export const HOME_EXPERIENCES_LIMIT = 12

export function customerExperienceImageSrc(url: string | null | undefined, cacheKey = ''): string {
  if (!url?.trim()) return ''
  const sep = url.includes('?') ? '&' : '?'
  return cacheKey ? `${url}${sep}v=${cacheKey}` : url
}

export function formatExperienceEventDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}
