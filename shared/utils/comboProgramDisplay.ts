import type { ComboCustomerSegment, ComboProgramStatus } from '~~/shared/types/comboProgram'

/** บิลแรกจ่ายเต็ม — ส่วนลด combo มีผลตั้งแต่บิลนี้ (คงที่ในโค้ด ไม่เก็บใน DB) */
export const COMBO_EFFECTIVE_FROM_BILL = 2

/** โหมดคำนวณเดียว: เลื่อนราคาลด (ไม่ใช่เครดิตส่วนต่าง) */
export const COMBO_DISCOUNT_MODE = 'defer_rate' as const

export const comboCalculationNote =
  'งวดที่ 1 จ่ายเต็ม · งวดที่ 2 หักส่วนลด = % ของงวด 1 + % ของงวด 2 · งวดที่ 3 ขึ้นไปหัก % ของงวดนั้น'

/** คำอธิบายสั้นสำหรับ UI งวดที่ 2 */
export const comboDeferFromBill1Note =
  'งวดที่ 1 ชำระราคาเต็ม (ยังไม่หัก combo) · งวดที่ 2 รวมส่วนลดทั้งจาก % ของงวดแรกที่เลื่อนมา และ % ของงวดที่ 2'

export const comboSegmentLabels: Record<ComboCustomerSegment, string> = {
  new: 'ลูกค้าใหม่',
  existing: 'ลูกค้าเก่า',
}

export const comboStatusLabels: Record<ComboProgramStatus, string> = {
  draft: 'แบบร่าง',
  published: 'เผยแพร่',
}

export function formatTierRange(minItems: number, maxItems: number | null): string {
  if (maxItems == null) return `${minItems} ชิ้นขึ้นไป`
  if (minItems === maxItems) return `${minItems} ชิ้น`
  return `${minItems}–${maxItems} ชิ้น`
}

export function isComboProgramLive(
  p: Pick<{ status: ComboProgramStatus, is_active: boolean, starts_at: string | null, ends_at: string | null }>,
  now = new Date(),
): boolean {
  if (p.status !== 'published' || !p.is_active) return false
  const t = now.getTime()
  if (p.starts_at && new Date(p.starts_at).getTime() > t) return false
  if (p.ends_at && new Date(p.ends_at).getTime() < t) return false
  return true
}
