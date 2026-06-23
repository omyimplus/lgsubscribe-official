export type LpApplicationStatus = 'new' | 'contacted' | 'closed'

export type LpSalesExperience = 'yes' | 'no'

export type LpWorkMode = 'offline' | 'online'

export type LpEmploymentType = 'part_time' | 'full_time'

export type LpSubscribeAwareness = 'know' | 'unknown' | 'customer'

export type LpExpectedIncome =
  | '20000_30000'
  | '30001_50000'
  | '50001_100000'
  | '100001_plus'

export type LpQuestionnaire = {
  sales_experience: LpSalesExperience
  work_mode: LpWorkMode
  employment_type: LpEmploymentType
  lg_subscribe_awareness: LpSubscribeAwareness
  motivation: string
  expected_income: LpExpectedIncome
}

export interface LpApplication {
  id: string
  first_name: string
  last_name: string
  contact_phone: string
  email: string
  line_id: string
  province: string
  preferred_contact_time: string
  questionnaire: LpQuestionnaire
  status: LpApplicationStatus
  created_at: string
  updated_at: string
}

export interface LpApplicationInput {
  first_name: string
  last_name: string
  contact_phone: string
  email: string
  line_id: string
  province: string
  preferred_contact_time: string
  sales_experience: LpSalesExperience
  work_mode: LpWorkMode
  employment_type: LpEmploymentType
  lg_subscribe_awareness: LpSubscribeAwareness
  motivation: string
  expected_income: LpExpectedIncome
  security_code: string
  security_code_expected: string
}

export interface LpApplicationCreateResponse {
  id: string
}
