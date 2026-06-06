export type SitePhone = {
  display: string
  tel: string
}

/** ช่องทางติดต่อ LG Subscribe Official — แก้ที่เดียวใช้ทั้งระบบ */
export const SITE_LINE_OA_URL = 'https://lin.ee/w5FowCj'
export const SITE_LINE_OA_ID = 'LGSub.Official'
export const SITE_LINE_QR_IMAGE = '/images/qrcode_line.jpg'

export const SITE_PHONES: SitePhone[] = [
  { display: '062-5969446', tel: '0625969446' },
  { display: '089-3546442', tel: '0893546442' },
]

export const SITE_PHONES_DISPLAY = SITE_PHONES.map(p => p.display).join(', ')

export const SITE_FACEBOOK_URL = 'https://web.facebook.com/SubscribeDGua'
export const SITE_TIKTOK_HANDLE = '@LG_Subscription'
export const SITE_TIKTOK_URL = 'https://www.tiktok.com/@LG_Subscription'

export const SITE_BUSINESS_HOURS = 'จันทร์–อาทิตย์ 09:00–20:00 น.'

export const SITE_OFFICE_ADDRESS =
  'เลขที่ 195 อาคารวัน แบงค็อก ทาวเวอร์ 4 ห้องเลขที่ 2301-2314 ชั้น 23 ถนนวิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพมหานคร 10330'

export type SiteSocialLink = {
  label: string
  href: string
  icon: string
}

export const SITE_SOCIAL_LINKS: SiteSocialLink[] = [
  { label: 'Facebook', href: SITE_FACEBOOK_URL, icon: 'mdi:facebook' },
  { label: 'TikTok', href: SITE_TIKTOK_URL, icon: 'mdi:tiktok' },
]
