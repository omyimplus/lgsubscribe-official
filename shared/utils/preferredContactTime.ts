/** ช่วงเวลาที่สะดวกให้ติดต่อกลับ — ใช้ทั้งฟอร์ม LP และ Subscribe */
export const PREFERRED_CONTACT_TIME_OPTIONS = [
  '09:00 – 12:00 น.',
  '12:00 – 14:00 น.',
  '14:00 – 17:00 น.',
  '17:00 – 20:00 น.',
  'จันทร์–ศุกร์ 09:00–17:00 น.',
  'เสาร์–อาทิตย์ 09:00–12:00 น.',
  'ติดต่อได้ทุกช่วงเวลา',
] as const

export type PreferredContactTimeOption = (typeof PREFERRED_CONTACT_TIME_OPTIONS)[number]

export function isPreferredContactTimeOption(value: string): value is PreferredContactTimeOption {
  return (PREFERRED_CONTACT_TIME_OPTIONS as readonly string[]).includes(value)
}
