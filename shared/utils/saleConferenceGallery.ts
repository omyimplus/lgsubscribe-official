/** ภาพกิจกรรม Sale Conference (GM005) — public/images/sale-conference/ */
export const SALE_CONFERENCE_IMAGE_COUNT = 54

export const SALE_CONFERENCE_IMAGES = Array.from(
  { length: SALE_CONFERENCE_IMAGE_COUNT },
  (_, i) => `/images/sale-conference/sale-conference-${String(i + 1).padStart(2, '0')}.webp`,
)

export const SALE_CONFERENCE_SECTION = {
  title: 'ประมวลภาพกิจกรรมงาน Sale Conference ภายใต้การบริหารงานของ GM005',
  subtitle: 'มีทั้งความอบอุ่น รอยยิ้ม ความรู้มากมาย มาเป็นทีมเดียวกับเราสิคะ',
}
