export interface CartPdfEmailLead {
  id: string
  email: string
  first_requested_at: string
  last_requested_at: string
  request_count: number
  last_email_sent_at: string | null
}

export interface CartPdfEmailLeadsAdminResponse {
  leads: CartPdfEmailLead[]
  smtp: {
    configured: boolean
    host: string
    from: string
  }
}
