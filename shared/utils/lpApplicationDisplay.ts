import type {
  LpApplicationStatus,
  LpEmploymentType,
  LpExpectedIncome,
  LpSalesExperience,
  LpSubscribeAwareness,
  LpWorkMode,
} from '~~/shared/types/lpApplication'

export const LP_STATUS_LABELS: Record<LpApplicationStatus, string> = {
  new: 'ใหม่',
  contacted: 'ติดต่อแล้ว',
  closed: 'ปิดแล้ว',
}

export const LP_SALES_EXPERIENCE_LABELS: Record<LpSalesExperience, string> = {
  yes: 'เคย',
  no: 'ไม่เคย',
}

export const LP_WORK_MODE_LABELS: Record<LpWorkMode, string> = {
  offline: 'Offline',
  online: 'Online',
}

export const LP_EMPLOYMENT_TYPE_LABELS: Record<LpEmploymentType, string> = {
  part_time: 'Part time',
  full_time: 'Full time',
}

export const LP_AWARENESS_LABELS: Record<LpSubscribeAwareness, string> = {
  know: 'รู้จัก',
  unknown: 'ไม่รู้จัก',
  customer: 'เป็นลูกค้า Subscribe',
}

export const LP_INCOME_LABELS: Record<LpExpectedIncome, string> = {
  '20000_30000': '20,000-30,000',
  '30001_50000': '30,001-50,000',
  '50001_100000': '50,001-100,000',
  '100001_plus': '100,001 ขึ้นไป',
}

export function lpApplicantDisplayName(first: string, last: string) {
  return [first, last].filter(Boolean).join(' ').trim()
}
