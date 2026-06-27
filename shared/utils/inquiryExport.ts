import type { InquiryItem, InquiryStatus, SubscriptionInquiry } from '~~/shared/types/inquiry'
import { comboSegmentLabels } from '~~/shared/utils/comboProgramDisplay'
import { summarizeComboBillTotals } from '~~/shared/utils/comboPricing'
import { formatContactAddress, formatContactDisplayName } from '~~/shared/utils/inquiryForm'
import { buildLineSummary } from '~~/shared/utils/inquiryLineSummary'
import { inquirySourceLabel } from '~~/shared/utils/inquirySource'
import { formatMoneyForExport } from '~~/shared/utils/moneyFormat'
import { formatInquiryContractSummary, serviceModeLabels } from '~~/shared/utils/planDisplay'

export const INQUIRY_EXPORT_HEADERS = [
  'รหัสคำขอ',
  'สถานะ',
  'สร้างเมื่อ',
  'อัปเดตล่าสุด',
  'ประเภทผู้สมัคร',
  'แหล่งคำขอ',
  'ชื่อ',
  'นามสกุล',
  'ชื่อที่แสดง',
  'ชื่อบริษัท',
  'เลขทะเบียนนิติบุคคล',
  'ชื่อกรรมการผู้มีอำนาจ',
  'นามสกุลกรรมการผู้มีอำนาจ',
  'เบอร์โทร',
  'Line ID',
  'ที่อยู่ (รวม)',
  'ตำบล/แขวง',
  'อำเภอ/เขต',
  'จังหวัด',
  'รหัสไปรษณีย์',
  'เวลาที่สะดวกให้ติดต่อกลับ',
  'หมายเหตุลูกค้า',
  'ลูกค้า login (customer_id)',
  'จำนวนรหัสสินค้า',
  'Combo กลุ่มลูกค้า',
  'Combo โปรแกรม',
  'Combo ส่วนลด %',
  'Combo จำนวนชิ้น',
  'Combo งวด 1 (บาท)',
  'Combo งวด 2 (บาท)',
  'Combo ประหยัดรวม (บาท)',
  'Combo ยอดรวมหลังลด (บาท)',
  'Combo คำนวณเมื่อ',
  'มัดจำรวม (บาท)',
  'ยอดสัญญารวม (บาท)',
  'ยอดสุทธิรวม (บาท)',
  'รายการสินค้า (รายละเอียด)',
  'สรุปข้อความ (Line)',
] as const

export const INQUIRY_ITEM_EXPORT_HEADERS = [
  ...INQUIRY_EXPORT_HEADERS.slice(0, 23),
  'รายการที่',
  'product_id',
  'plan_id',
  'รหัสสินค้า',
  'ชื่อสินค้า',
  'Policy',
  'สัญญา',
  'ปี',
  'เดือน',
  'โหมดบริการ',
  'ราคา/เดือน (แสดง)',
  'หมายเหตุราคา',
  'มัดจำ (บาท)',
  'หมายเหตุมัดจำ',
  'ยอดสัญญา (บาท)',
  'ยอดสุทธิ (บาท)',
  'ช่วงบิล (tiers)',
  ...INQUIRY_EXPORT_HEADERS.slice(20, 32),
  'สรุปข้อความ (Line)',
] as const

function formatDateExport(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

function serviceModeLabel(mode: InquiryItem['service_mode'] | undefined) {
  if (!mode) return '—'
  return serviceModeLabels[mode] ?? mode
}

function formatBaht(n: number | null | undefined) {
  return formatMoneyForExport(n)
}

function statusLabelTh(s: InquiryStatus) {
  if (s === 'new') return 'ใหม่'
  if (s === 'contacted') return 'ติดต่อแล้ว'
  return 'ปิดแล้ว'
}

function formatBillingTiers(item: InquiryItem) {
  return (item.billing_tiers ?? [])
    .map((t) => {
      const range = t.bill_to != null && t.bill_to !== t.bill_from
        ? `บิล ${t.bill_from}–${t.bill_to}`
        : `บิล ${t.bill_from}`
      const note = t.note ? ` (${t.note})` : ''
      return `${range}: ${formatBaht(t.monthly_price)} บ./ด.${note}`
    })
    .join(' | ')
}

function inquiryContactFields(row: SubscriptionInquiry) {
  const p = row.contact_profile
  const applicant = row.applicant_type ?? p?.applicant_type ?? 'individual'
  return {
    applicantType: applicant === 'corporate' ? 'นิติบุคคล' : 'บุคคลธรรมดา',
    inquirySource: inquirySourceLabel(row.inquiry_source),
    firstName: p?.first_name ?? '',
    lastName: p?.last_name ?? '',
    displayName: p ? formatContactDisplayName(p) : row.contact_name,
    companyName: p?.company_name ?? '',
    companyReg: p?.company_registration ?? '',
    directorFirstName: p?.director_first_name ?? '',
    directorLastName: p?.director_last_name ?? '',
    phone: p?.contact_phone || row.contact_phone,
    lineId: row.contact_line_id ?? '',
    address: p?.address_line ? formatContactAddress(p) : '',
    subdistrict: p?.subdistrict ?? '',
    district: p?.district ?? '',
    province: p?.province ?? '',
    postalCode: p?.postal_code ?? '',
    preferredContactTime: p?.preferred_contact_time ?? '',
    note: row.contact_note ?? '',
  }
}

function comboExportFields(row: SubscriptionInquiry) {
  const snap = row.combo_snapshot
  const quote = snap?.quote
  const segment = row.combo_customer_segment ?? snap?.customer_segment
  const bill1 = quote ? summarizeComboBillTotals(quote, 1) : null
  const bill2 = quote ? summarizeComboBillTotals(quote, 2) : null
  return {
    segment: segment ? comboSegmentLabels[segment] : '',
    program: snap?.program_name ?? '',
    percent: quote?.percent != null ? String(quote.percent) : '',
    itemCount: quote?.item_count != null ? String(quote.item_count) : '',
    bill1: bill1 ? formatBaht(bill1.total_charged) : '',
    bill2: bill2?.has_data ? formatBaht(bill2.total_charged) : '',
    savings: quote?.savings ? formatBaht(quote.savings) : '',
    orderTotal: quote?.order_total_charged ? formatBaht(quote.order_total_charged) : '',
    quotedAt: snap?.quoted_at ? formatDateExport(snap.quoted_at) : '',
    orderTotalNum: quote?.order_total_charged ?? null,
  }
}

function inquiryTotals(row: SubscriptionInquiry) {
  const items = row.items ?? []
  const combo = comboExportFields(row)
  const advanceTotal = items.reduce((sum, i) => sum + (Number(i.advance_amount) || 0), 0)
  const contractTotal = combo.orderTotalNum != null
    ? combo.orderTotalNum
    : items.reduce((sum, i) => sum + (i.computed_total ?? 0), 0)
  const netTotal = combo.orderTotalNum != null
    ? combo.orderTotalNum + advanceTotal
    : items.reduce(
        (sum, i) => sum + (i.computed_net_total ?? (i.computed_total ?? 0) + (Number(i.advance_amount) || 0)),
        0,
      )
  return { advanceTotal, contractTotal, netTotal }
}

function formatItemBlock(item: InquiryItem, index: number) {
  const lines = [
    `[${index + 1}] ${item.name ?? 'สินค้า'} (${item.sku ?? '—'})`,
    `  plan: ${item.plan_id ?? '—'} · policy: ${item.policy_code ?? '—'}`,
    `  สัญญา: ${formatInquiryContractSummary(item)}`,
    item.display_price_note
      ? `  ราคา: ${item.display_price_note}`
      : `  ราคา/เดือน: ${formatBaht(item.display_monthly_price)} บ.`,
  ]
  if (item.billing_tiers?.length) {
    lines.push(`  ช่วงบิล: ${formatBillingTiers(item)}`)
  }
  if (item.advance_amount) {
    lines.push(`  มัดจำ: ${formatBaht(item.advance_amount)} บ.${item.advance_note ? ` (${item.advance_note})` : ''}`)
  }
  if (item.computed_total != null) {
    lines.push(`  ยอดสัญญา: ${formatBaht(item.computed_total)} บ.`)
  }
  if (item.computed_net_total != null) {
    lines.push(`  ยอดสุทธิ: ${formatBaht(item.computed_net_total)} บ.`)
  }
  return lines.join('\n')
}

function formatItemsDetail(items: InquiryItem[]) {
  if (!items.length) return ''
  return items.map((item, i) => formatItemBlock(item, i)).join('\n\n')
}

export function buildInquiryLineSummary(row: SubscriptionInquiry): string {
  const c = inquiryContactFields(row)
  return buildLineSummary(
    {
      name: c.displayName,
      phone: c.phone,
      lineId: c.lineId,
      note: c.note,
      profile: row.contact_profile,
      applicant_type: row.applicant_type,
      inquiry_source: row.inquiry_source,
    },
    row.items ?? [],
    row.combo_snapshot ?? null,
  )
}

function inquiryBaseColumns(row: SubscriptionInquiry) {
  const c = inquiryContactFields(row)
  const combo = comboExportFields(row)
  const totals = inquiryTotals(row)
  const items = row.items ?? []
  return {
    contact: [
      row.id,
      statusLabelTh(row.status),
      formatDateExport(row.created_at),
      formatDateExport(row.updated_at),
      c.applicantType,
      c.inquirySource,
      c.firstName,
      c.lastName,
      c.displayName,
      c.companyName,
      c.companyReg,
      c.directorFirstName,
      c.directorLastName,
      c.phone,
      c.lineId,
      c.address,
      c.subdistrict,
      c.district,
      c.province,
      c.postalCode,
      c.preferredContactTime,
      c.note,
      row.customer_id ?? '',
    ],
    comboAndTotals: [
      String(items.length),
      combo.segment,
      combo.program,
      combo.percent,
      combo.itemCount,
      combo.bill1,
      combo.bill2,
      combo.savings,
      combo.orderTotal,
      combo.quotedAt,
      formatBaht(totals.advanceTotal),
      formatBaht(totals.contractTotal),
      formatBaht(totals.netTotal),
    ],
    lineSummary: buildInquiryLineSummary(row),
    itemsDetail: formatItemsDetail(items),
  }
}

/** หนึ่งแถวต่อคำขอ — เหมาะสำหรับติดต่อลูกค้าแบบรวม */
export function buildInquirySummaryExportRows(inquiries: SubscriptionInquiry[]) {
  return inquiries.map((row) => {
    const { contact, comboAndTotals, itemsDetail, lineSummary } = inquiryBaseColumns(row)
    return [...contact, ...comboAndTotals, itemsDetail, lineSummary]
  })
}

/** หนึ่งแถวต่อรหัสสินค้า — เหมาะกรองใน Excel */
export function buildInquiryItemExportRows(inquiries: SubscriptionInquiry[]) {
  const rows: (string | number)[][] = []
  for (const row of inquiries) {
    const { contact, comboAndTotals, lineSummary } = inquiryBaseColumns(row)
    const items = row.items ?? []
    if (!items.length) {
      rows.push([
        ...contact,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ...comboAndTotals,
        lineSummary,
      ])
      continue
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!
      rows.push([
        ...contact,
        String(i + 1),
        item.product_id,
        item.plan_id,
        item.sku,
        item.name,
        item.policy_code,
        item.contract_label,
        String(item.contract_years),
        String(item.contract_months),
        serviceModeLabel(item.service_mode),
        formatBaht(item.display_monthly_price),
        item.display_price_note ?? '',
        formatBaht(item.advance_amount),
        item.advance_note ?? '',
        formatBaht(item.computed_total),
        formatBaht(item.computed_net_total),
        formatBillingTiers(item),
        ...comboAndTotals,
        lineSummary,
      ])
    }
  }
  return rows
}
