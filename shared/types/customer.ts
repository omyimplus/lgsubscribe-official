export interface CustomerProfile {
  id: string
  email: string
  full_name: string
  phone: string
  line_id: string
  contact_note: string
  marketing_consent: boolean
  created_at: string
  updated_at: string
}

export interface CustomerProfileInput {
  full_name?: string
  phone?: string
  line_id?: string
  contact_note?: string
  marketing_consent?: boolean
}
