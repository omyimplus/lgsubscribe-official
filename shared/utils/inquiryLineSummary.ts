import type { InquiryApplicantType, InquiryComboSnapshot, InquiryContactProfile, InquiryItem } from '~~/shared/types/inquiry'
import { getCartItemQuantity, lineAdvanceTotal, lineMonthlyTotal, lineNetTotal } from '~~/shared/utils/cartQuantity'
import { comboSegmentLabels } from '~~/shared/utils/comboProgramDisplay'
import { formatContactAddress } from '~~/shared/utils/inquiryForm'
import { summarizeComboBillTotals } from '~~/shared/utils/comboPricing'
import { formatBahtPlain } from '~~/shared/utils/moneyFormat'
import { serviceModeLabels } from '~~/shared/utils/planDisplay'

function formatBahtLine(n: number | null | undefined) {
  return formatBahtPlain(n)
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
  ]
  if (applicantType === 'corporate' && profile?.company_name) {
    lines.push(`บริษัท: ${profile.company_name}`)
    if (profile.company_registration) {
      lines.push(`เลขทะเบียน: ${profile.company_registration}`)
    }
    if (profile.director_first_name || profile.director_last_name) {
      lines.push(`กรรมการผู้มีอำนาจ: ${[profile.director_first_name, profile.director_last_name].filter(Boolean).join(' ')}`)
    }
    lines.push(`ผู้ติดต่อ: ${contact.name}`)
  }
  else {
    lines.push(`ชื่อ: ${contact.name}`)
  }
  lines.push(`โทร: ${contact.phone}`)
  if (profile?.address_line) {
    const addressLabel = applicantType === 'corporate' ? 'ที่อยู่ติดตั้ง' : 'ที่อยู่'
    lines.push(`${addressLabel}: ${formatContactAddress(profile)}`)
  }
  if (profile?.preferred_contact_time) {
    lines.push(`เวลาที่สะดวกให้ติดต่อกลับ: ${profile.preferred_contact_time}`)
  }
  if (contact.lineId) lines.push(`Line: ${contact.lineId}`)
  lines.push('', 'รายการสินค้า:')
  for (const item of items) {
    const qty = getCartItemQuantity(item)
    const mode = serviceModeLabels[item.service_mode] ?? item.service_mode ?? '—'
    lines.push(`- ${item.name ?? 'สินค้า'}${qty > 1 ? ` ×${qty}` : ''} (${item.sku ?? '—'})`)
    lines.push(
      `  สัญญา: ${item.contract_label ?? '—'} · ${item.contract_years ?? '?'} ปี · ${mode}`,
    )
    if (item.display_price_note) {
      lines.push(`  ราคา: ${item.display_price_note}`)
    }
    else {
      const monthly = lineMonthlyTotal(item)
      if (monthly) {
        lines.push(
          qty > 1
            ? `  ราคาเริ่ม: ${formatBahtLine(monthly)} บ./เดือน (รวม ${qty} ชิ้น)`
            : `  ราคาเริ่ม: ${formatBahtLine(monthly)} บ./เดือน`,
        )
      }
    }
    const netTotal = lineNetTotal(item)
    if (netTotal != null && !Number.isNaN(netTotal)) {
      lines.push(`  ยอดสุทธิก่อน combo: ${formatBahtLine(netTotal)}`)
    }
    const advanceTotal = lineAdvanceTotal(item)
    if (advanceTotal > 0) {
      lines.push(
        qty > 1
          ? `  มัดจำ: ${formatBahtLine(advanceTotal)} (รวม ${qty} ชิ้น)`
          : `  มัดจำ: ${formatBahtLine(advanceTotal)}`,
      )
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
