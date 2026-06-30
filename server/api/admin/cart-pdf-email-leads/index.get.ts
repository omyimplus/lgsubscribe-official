import type { CartPdfEmailLead, CartPdfEmailLeadsAdminResponse } from '~~/shared/types/cartPdfEmailLead'
import { isMailConfigured, isSmtpConfigured } from '~~/server/utils/mailer'
import { isThaibulkEmailConfigured } from '~~/server/utils/thaibulkEmail'

function maskSmtpHost(host: string) {
  const trimmed = host.trim()
  if (!trimmed) return ''
  if (trimmed.length <= 6) return '••••••'
  return `${trimmed.slice(0, 3)}•••${trimmed.slice(-4)}`
}

export default defineEventHandler(async (): Promise<CartPdfEmailLeadsAdminResponse> => {
  const config = useRuntimeConfig()
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('cart_pdf_email_leads')
    .select('id, email, first_requested_at, last_requested_at, request_count, last_email_sent_at')
    .order('last_requested_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return {
    leads: (data ?? []) as CartPdfEmailLead[],
    mail: {
      configured: isMailConfigured(),
      provider: isThaibulkEmailConfigured() ? 'thaibulk' as const : isSmtpConfigured() ? 'smtp' as const : null,
      host: maskSmtpHost(String(config.smtpHost ?? '')),
      from: isThaibulkEmailConfigured()
        ? String(config.thaibulkEmailFrom ?? '').trim()
        : String(config.smtpFrom ?? '').trim(),
    },
    // backward compat for admin UI
    smtp: {
      configured: isMailConfigured(),
      host: maskSmtpHost(String(config.smtpHost ?? '')),
      from: isThaibulkEmailConfigured()
        ? String(config.thaibulkEmailFrom ?? '').trim()
        : String(config.smtpFrom ?? '').trim(),
    },
  }
})
