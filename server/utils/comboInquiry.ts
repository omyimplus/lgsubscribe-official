import type { SupabaseClient } from '@supabase/supabase-js'
import type { ComboCustomerSegment } from '~~/shared/types/comboProgram'
import type { InquiryComboSnapshot, InquiryItem } from '~~/shared/types/inquiry'
import { listPublishedComboPrograms } from '~~/server/utils/comboProgramsDb'
import { pickBestComboProgram } from '~~/shared/utils/comboProgramPick'
import { buildComboQuote } from '~~/shared/utils/comboPricing'

export function parseComboCustomerSegment(value: unknown): ComboCustomerSegment {
  return value === 'existing' ? 'existing' : 'new'
}

export async function buildInquiryComboSnapshot(
  supabase: SupabaseClient,
  items: InquiryItem[],
  segment: ComboCustomerSegment,
): Promise<InquiryComboSnapshot | null> {
  if (!items.length) return null

  const programs = await listPublishedComboPrograms(supabase)
  const program = pickBestComboProgram(programs, segment, items.length)
  if (!program) return null

  const quote = buildComboQuote(items, program, segment)

  return {
    customer_segment: segment,
    program_id: program.id,
    program_name: program.name,
    quote,
    quoted_at: new Date().toISOString(),
  }
}
