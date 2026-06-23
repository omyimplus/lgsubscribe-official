import type { LpQuestionnaire } from '~~/shared/types/lpApplication'
import {
  LP_AWARENESS_LABELS,
  LP_EMPLOYMENT_TYPE_LABELS,
  LP_INCOME_LABELS,
  LP_SALES_EXPERIENCE_LABELS,
  LP_WORK_MODE_LABELS,
  lpApplicantDisplayName,
} from '~~/shared/utils/lpApplicationDisplay'

export function buildLpApplicationLineSummary(contact: {
  first_name: string
  last_name: string
  contact_phone: string
  email: string
  line_id: string
  province: string
  preferred_contact_time: string
  questionnaire: LpQuestionnaire
}) {
  const q = contact.questionnaire
  return [
    'สมัคร LP — Lifestyle Planner',
    `ชื่อ: ${lpApplicantDisplayName(contact.first_name, contact.last_name)}`,
    `โทร: ${contact.contact_phone}`,
    `Email: ${contact.email}`,
    `Line ID: ${contact.line_id}`,
    `จังหวัด: ${contact.province}`,
    `เวลาติดต่อกลับ: ${contact.preferred_contact_time}`,
    '',
    'คำถามเบื้องต้น:',
    `1. ประสบการณ์ขาย: ${LP_SALES_EXPERIENCE_LABELS[q.sales_experience]}`,
    `2. รูปแบบงาน: ${LP_WORK_MODE_LABELS[q.work_mode]}`,
    `3. ประเภทงาน: ${LP_EMPLOYMENT_TYPE_LABELS[q.employment_type]}`,
    `4. รู้จัก LG Subscribe: ${LP_AWARENESS_LABELS[q.lg_subscribe_awareness]}`,
    `5. เหตุผล: ${q.motivation}`,
    `6. รายได้ที่ต้องการ/เดือน: ${LP_INCOME_LABELS[q.expected_income]}`,
  ].join('\n')
}
