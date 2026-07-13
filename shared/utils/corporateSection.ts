export const CORPORATE_PAGE_PATH = '/corporate'

/** ปุ่ม CTA หลัก — เปิด Line โดยตรง */
export const CORPORATE_LINE_CTA_LABEL = 'แอดไลน์สอบถาม'

export type CorporateBenefit = {
  title: string
  description: string
}

export const CORPORATE_SECTION = {
  brand: 'LG Subscribe',
  tagline: 'ทางเลือกใหม่',
  title: 'สำหรับลูกค้าองค์กรและภาคธุรกิจ',
  subtitle: 'เปลี่ยนรายจ่ายลงทุน เป็นรายจ่ายดำเนินงาน บริหารจัดการง่าย สบายสภาพคล่อง',
  intro:
    'ในยุคที่เศรษฐกิจมีความผันผวนและการแข่งขันสูง LG พร้อมเป็นพาร์ทเนอร์ที่ช่วยลดภาระต้นทุน และบริหารจัดการค่าใช้จ่ายให้มีประสิทธิภาพ',
  whyTitle: 'ทำไมธุรกิจของคุณควรเลือก LG Subscribe?',
  benefits: [
    {
      title: 'รักษาสภาพคล่องทางการเงิน',
      description:
        'ไม่ต้องจ่ายเงินก้อนใหญ่ในการลงทุนเครื่องใช้ไฟฟ้า ช่วยให้ธุรกิจมีเงินสดหมุนเวียนได้อย่างต่อเนื่อง',
    },
    {
      title: 'ควบคุมงบประมาณได้แม่นยำ',
      description:
        'จ่ายรายเดือนในอัตราคงที่ วางแผนงบประมาณได้ชัดเจน ไม่มีค่าใช้จ่ายแอบแฝงหรือค่าซ่อมเล็กน้อย',
    },
    {
      title: 'รับประกันยาวนานสูงสุด 7 ปี',
      description:
        'ครอบคลุมทั้งค่าแรงและค่าอะไหล่ตลอดอายุสัญญา มั่นใจได้ว่าเครื่องใช้ไฟฟ้าของคุณได้รับการดูแลอย่างครบถ้วน',
    },
    {
      title: 'บริการดูแลโดยมืออาชีพ',
      description:
        'ทีม LG Specialist ดูแลบำรุงรักษาและทำความสะอาดเครื่องใช้ไฟฟ้าอย่างสม่ำเสมอ ถึงที่',
    },
    {
      title: 'ยกระดับภาพลักษณ์ธุรกิจ',
      description:
        'ใช้นวัตกรรมล่าสุดจาก LG สร้างความประทับใจให้ลูกค้าและบุคลากรของคุณ',
    },
  ] satisfies CorporateBenefit[],
  /** รูป Superbrands — `public/images/lg_cre.jpg` */
  awardImage: '/images/lg_cre.jpg',
} as const
