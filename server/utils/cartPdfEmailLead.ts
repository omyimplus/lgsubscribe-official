import type { SupabaseClient } from '@supabase/supabase-js'

export function normalizeLeadEmail(email: string) {
  return email.trim().toLowerCase()
}

/** บันทึกหรืออัปเดตอีเมล (ไม่ซ้ำ — นับจำนวนครั้งที่ขอซ้ำ) */
export async function upsertCartPdfEmailLead(
  supabase: SupabaseClient,
  rawEmail: string,
): Promise<{ id: string, isNew: boolean }> {
  const email = normalizeLeadEmail(rawEmail)
  const now = new Date().toISOString()

  const { data: existing, error: selectError } = await supabase
    .from('cart_pdf_email_leads')
    .select('id, request_count')
    .eq('email', email)
    .maybeSingle()

  if (selectError) {
    throw createError({ statusCode: 500, message: selectError.message })
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('cart_pdf_email_leads')
      .update({
        last_requested_at: now,
        request_count: existing.request_count + 1,
      })
      .eq('id', existing.id)

    if (updateError) {
      throw createError({ statusCode: 500, message: updateError.message })
    }

    return { id: existing.id, isNew: false }
  }

  const { data: row, error: insertError } = await supabase
    .from('cart_pdf_email_leads')
    .insert({
      email,
      first_requested_at: now,
      last_requested_at: now,
      request_count: 1,
    })
    .select('id')
    .single()

  if (insertError) {
    throw createError({ statusCode: 500, message: insertError.message })
  }

  return { id: row.id, isNew: true }
}

export async function markCartPdfEmailSent(
  supabase: SupabaseClient,
  id: string,
) {
  const { error } = await supabase
    .from('cart_pdf_email_leads')
    .update({ last_email_sent_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }
}
