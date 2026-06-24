export const SERVICE_CARE_SECTION_TITLE = 'งานบริการ - LG Service Care'

export const SERVICE_CARE_ITEM_PREFIX = 'LG Service Care'

export type ServiceCareSlug =
  | 'washing-machine'
  | 'refrigerator'
  | 'air-purifier'
  | 'water-purifier'
  | 'vacuum-cleaner'
  | 'air-conditioner'
  | 'styler'

export type ServiceCareVideoSettings = {
  slug: ServiceCareSlug
  sort_order: number
  label_th: string
  youtube_url: string | null
  video_id: string | null
  updated_at: string
}

export type ServiceCareVideoPublic = {
  slug: ServiceCareSlug
  sort_order: number
  label: string
  full_label: string
  video: {
    video_id: string
    watch_url: string
  } | null
}

export type ServiceCarePagePublic = {
  title: string
  items: ServiceCareVideoPublic[]
}

export type ServiceCareVideoInput = {
  slug: ServiceCareSlug
  youtube_url?: string | null
}

export const SERVICE_CARE_CATALOG: ReadonlyArray<{
  slug: ServiceCareSlug
  sort_order: number
  label_th: string
  icon: string
}> = [
  { slug: 'washing-machine', sort_order: 1, label_th: 'เครื่องซักผ้า', icon: 'heroicons:sparkles' },
  { slug: 'refrigerator', sort_order: 2, label_th: 'ตู้เย็น', icon: 'heroicons:cube' },
  { slug: 'air-purifier', sort_order: 3, label_th: 'เครื่องฟอกอากาศ', icon: 'heroicons:cloud' },
  { slug: 'water-purifier', sort_order: 4, label_th: 'เครื่องกรองน้ำ', icon: 'heroicons:beaker' },
  { slug: 'vacuum-cleaner', sort_order: 5, label_th: 'เครื่องดูดฝุ่น', icon: 'heroicons:home-modern' },
  { slug: 'air-conditioner', sort_order: 6, label_th: 'เครื่องปรับอากาศ', icon: 'heroicons:sun' },
  { slug: 'styler', sort_order: 7, label_th: 'ตู้ถนอมผ้า', icon: 'heroicons:archive-box' },
]

export function serviceCareFullLabel(labelTh: string) {
  return `${SERVICE_CARE_ITEM_PREFIX} - ${labelTh}`
}
