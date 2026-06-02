import type { Promotion } from '~~/shared/types/promotion'

type PromotionSchedule = Pick<Promotion, 'status' | 'is_active' | 'starts_at' | 'ends_at'>

/** โปรที่ published + active และอยู่ในช่วงวันที่ (ถ้ากำหนด) */
export function isPromotionLive(p: PromotionSchedule, now = new Date()) {
  if (p.status !== 'published' || !p.is_active) return false
  const t = now.getTime()
  if (p.starts_at && new Date(p.starts_at).getTime() > t) return false
  if (p.ends_at && new Date(p.ends_at).getTime() < t) return false
  return true
}

export type PromotionLiveStatus = {
  live: boolean
  reasons: string[]
}

/** เหตุผลที่ยังไม่แสดงบนหน้าร้าน */
export function getPromotionLiveStatus(
  p: PromotionSchedule,
  opts?: { product_count?: number },
  now = new Date(),
): PromotionLiveStatus {
  const reasons: string[] = []
  if (p.status !== 'published') reasons.push('สถานะเป็นแบบร่าง')
  if (!p.is_active) reasons.push('ปิดใช้งาน')
  if (p.starts_at && new Date(p.starts_at).getTime() > now.getTime()) {
    reasons.push('ยังไม่ถึงวันเริ่มโปร')
  }
  if (p.ends_at && new Date(p.ends_at).getTime() < now.getTime()) {
    reasons.push('เลยช่วงวันสิ้นสุดแล้ว')
  }
  if (opts?.product_count === 0) reasons.push('ยังไม่เลือกสินค้าในโปร')

  const live = isPromotionLive(p, now) && (opts?.product_count ?? 1) > 0
  return { live, reasons }
}

/** Cache-bust Supabase banner URL after replace (same path, upsert). */
export function promotionBannerSrc(
  imageUrl: string | null | undefined,
  version?: string | null,
) {
  const url = imageUrl?.trim()
  if (!url) return ''
  const v = version ? new Date(version).getTime() : Date.now()
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${v}`
}
