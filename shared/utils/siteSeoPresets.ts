import type { ArticleCategory } from '~~/shared/types/article'
import { joinKeywords } from '~~/shared/utils/siteSeo'

/** คำค้นหาหลักของแบรนด์ — ผสมกับคำเฉพาะหน้า */
export const SITE_BASE_KEYWORDS = [
  'LG Subscribe',
  'LG ผ่อน',
  'สมัคร LG Subscribe',
  'เครื่องใช้ไฟฟ้า LG',
  'ผ่อนรายเดือน',
  'สมัครใช้รายเดือน',
  'LG Subscription',
  'LG รายเดือน',
] as const

export type SiteSeoPreset = {
  title: string
  description: string
  keywords: string[]
  noindex?: boolean
}

function preset(
  title: string,
  description: string,
  keywords: string[],
  noindex?: boolean,
): SiteSeoPreset {
  return {
    title,
    description,
    keywords: joinKeywords(SITE_BASE_KEYWORDS, keywords).split(', '),
    noindex,
  }
}

export const SEO_HOME = preset(
  'LG Subscribe — เป็นเจ้าของ LG ง่ายกว่าใคร',
  'เริ่มต้นเพียงหลักร้อย จ่ายง่ายผ่อนสบาย สมัครใช้เครื่องใช้ไฟฟ้า LG แบบรายเดือน ทีวี ตู้เย็น เครื่องซักผ้า แอร์ และอื่นๆ',
  [
    'หน้าแรก LG Subscribe',
    'สมัคร LG ผ่อน',
    'LG เริ่มต้นหลักร้อย',
    'เครื่องใช้ไฟฟ้าผ่อน',
  ],
)

export const SEO_PRODUCTS = preset(
  'สินค้าทั้งหมด',
  'เลือกสินค้า LG Subscribe ผ่อนรายเดือน — ทีวี OLED/QNED ตู้เย็น เครื่องซักผ้า แอร์ และเครื่องใช้ไฟฟ้า LG ทุกหมวด',
  [
    'สินค้า LG Subscribe',
    'ทีวี LG ผ่อน',
    'ตู้เย็น LG ผ่อน',
    'เครื่องซักผ้า LG ผ่อน',
    'แอร์ LG ผ่อน',
    'รายการสินค้า LG',
  ],
)

export const SEO_PROMOTIONS = preset(
  'โปรโมชั่น',
  'โปรโมชั่นและข้อเสนอพิเศษ LG Subscribe อัปเดตล่าสุด สมัครผ่อนรายเดือนราคาพิเศษ',
  [
    'โปรโมชั่น LG Subscribe',
    'LG Subscribe ลดราคา',
    'โปร LG ผ่อน',
    'ข้อเสนอพิเศษ LG',
  ],
)

export const SEO_ARTICLES = preset(
  'บทความ',
  'บทความ LG Subscribe — ทำไมต้อง Subscribe วิธีสั่งซื้อ สาระน่ารู้ และคำถามที่พบบ่อย',
  [
    'บทความ LG Subscribe',
    'วิธีสมัคร LG Subscribe',
    'ทำไมต้อง LG Subscribe',
    'สาระน่ารู้ LG',
  ],
)

export const SEO_ARTICLE_CATEGORY: Record<ArticleCategory, SiteSeoPreset> = {
  'why-subscribe': preset(
    'ทำไมต้อง LG Subscribe',
    'เหตุผลที่ควรเลือก LG Subscribe แทนการซื้อสดหรือผ่อนทั่วไป — บริการครบ รับประกันยาว',
    ['ทำไมต้อง LG Subscribe', 'ข้อดี LG Subscribe', 'LG Subscribe ดีไหม'],
  ),
  'how-to-order': preset(
    'วิธีสั่งซื้อ LG Subscribe',
    'ขั้นตอนสมัคร LG Subscribe สำหรับบุคคลธรรมดา นิติบุคคล และชาวต่างชาติ',
    ['วิธีสมัคร LG Subscribe', 'ขั้นตอนสมัคร LG', 'สั่งซื้อ LG Subscribe'],
  ),
  knowledge: preset(
    'สาระน่ารู้',
    'สาระน่ารู้เกี่ยวกับ LG Subscribe เครื่องใช้ไฟฟ้า LG และการผ่อนรายเดือน',
    ['สาระน่ารู้ LG', 'LG Subscribe คืออะไร', 'ความรู้ LG Subscribe'],
  ),
}

export const SEO_CORPORATE = preset(
  'ลูกค้าองค์กร',
  'LG Subscribe สำหรับลูกค้าองค์กรและภาคธุรกิจ เปลี่ยนรายจ่ายลงทุนเป็นรายจ่ายดำเนินงาน บริหารจัดการง่าย สบายสภาพคล่อง',
  [
    'LG Subscribe องค์กร',
    'LG Subscribe นิติบุคคล',
    'LG Subscribe บริษัท',
    'สมัคร LG องค์กร',
    'ลูกค้าองค์กร LG',
  ],
)

export const SEO_CORPORATE_INQUIRY = preset(
  'กรอกข้อมูลองค์กร',
  'ส่งข้อมูลนิติบุคคลเพื่อให้ทีม LG Subscribe ติดต่อกลับและแนะนำแผนรายเดือนสำหรับธุรกิจ',
  ['ฟอร์ม LG Subscribe องค์กร', 'สมัคร LG นิติบุคคล'],
  true,
)

export const SEO_CONTACT = preset(
  'ติดต่อเรา',
  'ติดต่อ LG Subscribe Official — โทร 062-5969446, 089-3546442 หรือ Line @LGSub.Official จันทร์–อาทิตย์ 09:00–20:00 น.',
  [
    'ติดต่อ LG Subscribe',
    'LG Subscribe เบอร์โทร',
    'LG Subscribe Line',
    'LGSub.Official',
  ],
)

export const SEO_TRUST = preset(
  'ความน่าเชื่อถือ',
  'การรับประกันและบริการหลังการขาย LG Subscribe — มั่นใจได้ด้วยมาตรฐาน LG และทีมดูแลมืออาชีพ',
  [
    'LG Subscribe น่าเชื่อถือ',
    'รับประกัน LG Subscribe',
    'บริการหลังการขาย LG',
  ],
)

export const SEO_FAQ = preset(
  'FAQ',
  'คำถามที่พบบ่อยเกี่ยวกับ LG Subscribe การสมัคร การผ่อน การติดตั้ง และเงื่อนไขบริการ',
  [
    'FAQ LG Subscribe',
    'คำถาม LG Subscribe',
    'LG Subscribe ตอบคำถาม',
  ],
)

export const SEO_INSTALLMENT = preset(
  'เงื่อนไขการผ่อน',
  'เงื่อนไขการผ่อนรายเดือน LG Subscribe เริ่มต้นเพียงหลักร้อย จ่ายง่าย ไม่มีค่าใช้จ่ายแอบแฝง',
  [
    'เงื่อนไข LG Subscribe',
    'ผ่อน LG รายเดือน',
    'อัตราผ่อน LG Subscribe',
    'LG Subscribe กี่บาทต่อเดือน',
  ],
)

export const SEO_EXPERIENCES = preset(
  'LG Subscribe Customer Experiences',
  'ภาพบรรยากาศและกิจกรรม LG Subscribe — งานอีเวนต์ ประสบการณ์ลูกค้า และรีวิวจริง',
  [
    'LG Subscribe กิจกรรม',
    'LG Subscribe รีวิว',
    'ประสบการณ์ลูกค้า LG',
  ],
)

export const SEO_CAREERS = preset(
  'สมัคร LP — Lifestyle Planner',
  'สมัครงานอิสระเป็นตัวแทน LG Subscribe (Lifestyle Planner) ทำงานออนไลน์ ไม่ต้องลงทุน ไม่ต้องสต๊อกสินค้า',
  [
    'สมัคร LP LG Subscribe',
    'Lifestyle Planner LG',
    'ตัวแทน LG Subscribe',
    'ร่วมงานกับ LG Subscribe',
  ],
)

export const SEO_SUBSCRIBE_INQUIRY = preset(
  'สนใจผ่อน',
  'ส่งรายการสินค้าที่สนใจ LG Subscribe ให้ทีมงานติดต่อกลับเพื่อยืนยันแผนผ่อนรายเดือน',
  ['สนใจผ่อน LG', 'ฟอร์มสนใจ LG Subscribe'],
  true,
)

export function productKeywords(name: string, category?: string | null, sku?: string | null): string[] {
  return joinKeywords(SITE_BASE_KEYWORDS, [
    name,
    category ? `${category} LG Subscribe` : '',
    sku ? `รหัส ${sku}` : '',
    'สมัครผ่อน LG',
    `${name} ผ่อน`,
  ]).split(', ')
}

export function articleKeywords(title: string, category?: string | null): string[] {
  return joinKeywords(SITE_BASE_KEYWORDS, [
    title,
    category ? `บทความ ${category}` : '',
    'บทความ LG Subscribe',
  ]).split(', ')
}

export function promotionKeywords(title: string): string[] {
  return joinKeywords(SEO_PROMOTIONS.keywords, [
    title,
    `โปร ${title}`,
  ]).split(', ')
}
