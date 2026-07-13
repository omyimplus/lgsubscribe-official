export type SitePhone = {
  display: string
  tel: string
}

/** โดเมนหลักของเว็บ — ใช้เมื่อไม่ได้ตั้ง NUXT_PUBLIC_SITE_URL */
export const SITE_CANONICAL_URL = 'https://lgsubscribe-official.com'
export const SITE_LINE_OA_URL = 'https://lin.ee/w5FowCj'
export const SITE_LINE_OA_ID = 'LGSub.Official'
export const SITE_LINE_QR_IMAGE = '/images/qrcode_line.jpg'

export const SITE_PHONES: SitePhone[] = [
  { display: '062-5969446', tel: '0625969446' },
  { display: '089-3546442', tel: '0893546442' },
]

export const SITE_PHONES_DISPLAY = SITE_PHONES.map(p => p.display).join(', ')

export const SITE_FACEBOOK_URL = 'https://web.facebook.com/SubscribeDGua'
export const SITE_FACEBOOK_HANDLE = 'SubscribeDGua'
export const SITE_TIKTOK_HANDLE = '@LG_Subscription'
export const SITE_TIKTOK_URL = 'https://www.tiktok.com/@LG_Subscription'

export const SITE_BUSINESS_HOURS = '24 ชั่วโมง'

export const SITE_OFFICE_COMPANY_NAME = 'บริษัท แอลจี อีเลคทรอนิคส์ (ประเทศไทย) จำกัด'

export const SITE_OFFICE_COMPANY_NAME_EN = 'LG ELECTRONICS (THAILAND) CO., LTD.'

export const SITE_OFFICE_ADDRESS =
  '195 อาคารวัน แบงค็อก ทาวเวอร์ 4 ห้องเลขที่ 2301-2314 ชั้น 23 ถนนวิทยุ ลุมพินี เขตปทุมวัน กรุงเทพมหานคร'

/** ที่อยู่ร้านตัวแทน (ไม่ใช่สำนักงานบริษัท LG) */
export const SITE_STORE_NAME = 'LG Subscribe Shop Cosmo Bazaar เมืองทองธานี'

export const SITE_STORE_ADDRESS =
  'อาคารคอสโม บาซาร์, LG Subscribe Shop ชั้น 2, ถนนป๊อปปูล่า 3 อำเภอปากเกร็ด นนทบุรี 11120'

/** ข้อมูลตัวแทนแต่งตั้ง — แสดงบนหน้าแรกเพื่อความโปร่งใส */
export const SITE_AUTHORIZED_AGENT = {
  operatorName: 'นางสาวพันธ์ทิพย์ ชัยสิริสัมพันธ์',
  roleTitle: 'ผู้จัดการฝ่ายขาย LG Subscribe',
  salesCode: 'LSM063',
  agentCode: 'LGF226128',
} as const

export type SiteSocialLink = {
  label: string
  href: string
  icon: string
}

export const SITE_SOCIAL_LINKS: SiteSocialLink[] = [
  { label: 'Facebook', href: SITE_FACEBOOK_URL, icon: 'mdi:facebook' },
  { label: 'TikTok', href: SITE_TIKTOK_URL, icon: 'site-tiktok' },
]
