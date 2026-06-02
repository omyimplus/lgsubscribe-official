import type { InquiryApplicantType, InquiryComboSnapshot, InquiryContactProfile, InquiryItem } from '~~/shared/types/inquiry'
import { comboSegmentLabels } from '~~/shared/utils/comboProgramDisplay'
import { formatContactAddress } from '~~/shared/utils/inquiryForm'
import { summarizeComboBillTotals } from '~~/shared/utils/comboPricing'
import { serviceModeLabels } from '~~/shared/utils/planDisplay'

function formatBahtLine(n: number | null | undefined) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return `${Math.round(Number(n)).toLocaleString('th-TH')} บ.`
}

function formatMonthlyBaht(item: InquiryItem) {
  const raw = item.display_monthly_price ?? item.monthly_price
  if (raw == null || Number.isNaN(Number(raw))) return null
  return Number(raw).toLocaleString('th-TH')
}

export function buildLineSummary(
  contact: {
    name: string
    phone: string
    lineId: string
    note: string
    profile?: InquiryContactProfile
    applicant_type?: InquiryApplicantType
  },
  items: InquiryItem[],
  combo?: InquiryComboSnapshot | null,
) {
  const profile = contact.profile
  const applicantType = profile?.applicant_type ?? contact.applicant_type ?? 'individual'
  const lines = [
    'สนใจผ่อน LG Subscribe',
    applicantType === 'corporate' ? 'ประเภท: นิติบุคคล' : 'ประเภท: บุคคลธรรมดา',
    `ชื่อ: ${contact.name}`,
    `โทร: ${contact.phone}`,
  ]
  if (profile?.applicant_type === 'corporate' && profile.company_name) {
    lines.push(`บริษัท: ${profile.company_name}`)
    if (profile.company_registration) {
      lines.push(`เลขทะเบียน: ${profile.company_registration}`)
    }
  }
  if (profile?.address_line) {
    lines.push(`ที่อยู่: ${formatContactAddress(profile)}`)
  }
  if (contact.lineId) lines.push(`Line: ${contact.lineId}`)
  lines.push('', 'รายการสินค้า:')
  for (const item of items) {
    const mode = serviceModeLabels[item.service_mode] ?? item.service_mode ?? '—'
    lines.push(`- ${item.name ?? 'สินค้า'} (${item.sku ?? '—'})`)
    lines.push(
      `  สัญญา: ${item.contract_label ?? '—'} · ${item.contract_years ?? '?'} ปี · ${mode}`,
    )
    if (item.display_price_note) {
      lines.push(`  ราคา: ${item.display_price_note}`)
    }
    else {
      const monthly = formatMonthlyBaht(item)
      if (monthly) lines.push(`  ราคาเริ่ม: ${monthly} บ./เดือน`)
    }
    if (item.computed_net_total != null && !Number.isNaN(Number(item.computed_net_total))) {
      lines.push(`  ยอดสุทธิก่อน combo: ${formatBahtLine(item.computed_net_total)}`)
    }
    if (item.advance_amount) {
      lines.push(`  มัดจำ: ${Number(item.advance_amount).toLocaleString('th-TH')} บ.`)
    }
    if (item.advance_note) {
      lines.push(`  หมายเหตุมัดจำ: ${item.advance_note}`)
    }
  }

  if (combo?.quote) {
    const { quote } = combo
    const bill1 = summarizeComboBillTotals(quote, 1)
    const bill2 = summarizeComboBillTotals(quote, 2)
    lines.push('', 'ส่วนลด Combo:')
    lines.push(`  กลุ่ม: ${comboSegmentLabels[combo.customer_segment]}`)
    if (combo.program_name) {
      lines.push(`  โปรแกรม: ${combo.program_name}`)
    }
    if (quote.percent > 0) {
      lines.push(`  ส่วนลด: ${quote.percent}% (${quote.item_count} ชิ้น)`)
      lines.push(`  งวดที่ 1 ชำระเต็ม: ${formatBahtLine(bill1.total_charged)}`)
      if (bill2.has_data) {
        lines.push(`  งวดที่ 2 หลัง combo: ${formatBahtLine(bill2.total_charged)}`)
        if (bill2.total_deferred_discount > 0) {
          lines.push(`    - เลื่อนจากงวด 1 (${quote.percent}%): ${formatBahtLine(bill2.total_deferred_discount)}`)
        }
        if (bill2.total_own_discount > 0) {
          lines.push(`    - งวด 2 (${quote.percent}%): ${formatBahtLine(bill2.total_own_discount)}`)
        }
      }
      if (quote.savings > 0) {
        lines.push(`  ประหยัดรวมตลอดสัญญา: ${formatBahtLine(quote.savings)}`)
        lines.push(`  ยอดรวมหลัง combo: ${formatBahtLine(quote.order_total_charged)}`)
      }
    }
    else {
      lines.push('  (ไม่เข้าเงื่อนไขชั้นส่วนลดตามจำนวนชิ้น)')
    }
  }

  if (contact.note) {
    lines.push('', `หมายเหตุ: ${contact.note}`)
  }
  return lines.join('\n')
}
