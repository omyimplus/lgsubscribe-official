import type { ComboCustomerSegment, PublicComboProgram } from '~~/shared/types/comboProgram'
import { pickComboTier } from '~~/shared/utils/comboPricing'

/** เลือกโปรที่ให้ส่วนลด combo สูงสุดสำหรับ segment + จำนวนชิ้น (รองรับหลายโปรต่อ segment) */
export function pickBestComboProgram(
  programs: PublicComboProgram[],
  segment: ComboCustomerSegment,
  itemCount: number,
): PublicComboProgram | null {
  const candidates = programs.filter(p => p.customer_segment === segment && p.tiers.length)
  if (!candidates.length) return null

  let best: PublicComboProgram | null = null
  let bestPct = -1

  for (const program of candidates) {
    const tier = pickComboTier(program.tiers, itemCount)
    if (!tier) continue
    const pct = Number(tier.extra_discount_percent)
    const isBetter = !best
      || pct > bestPct
      || (
        pct === bestPct
        && new Date(program.updated_at).getTime() > new Date(best.updated_at).getTime()
      )
    if (isBetter) {
      best = program
      bestPct = pct
    }
  }

  return best
}
