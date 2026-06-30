import type { ComboCustomerSegment } from '~~/shared/types/comboProgram'
import type { InquiryComboSnapshot, InquiryItem } from '~~/shared/types/inquiry'
import { buildInquiryComboSnapshot, parseComboCustomerSegment } from '~~/server/utils/comboInquiry'
import { fetchSubscribeValuesForCart } from '~~/server/utils/cartPdfSubscribeValues'
import { renderInstallmentScheduleToPdfBuffer } from '~~/server/utils/installmentSchedulePdfDocument'
import { buildInstallmentSchedule } from '~~/shared/utils/installmentSchedule'
import { buildCartPdfSummary } from '~~/shared/utils/cartPdfSummary'
import { normalizeCartItems } from '~~/shared/utils/cartQuantity'

export const CART_INSTALLMENT_PDF_FILENAME = 'ตารางผ่อน.pdf'

export async function buildCartInstallmentSchedulePdf(
  items: InquiryItem[],
  comboSnapshot: InquiryComboSnapshot | null,
): Promise<Buffer> {
  const normalized = normalizeCartItems(items)
  const quote = comboSnapshot?.quote ?? null
  const schedule = buildInstallmentSchedule(normalized, quote)
  if (!schedule) {
    throw createError({ statusCode: 400, message: 'ไม่มีรายการในตะกร้า' })
  }

  const subscribeMap = await fetchSubscribeValuesForCart(
    normalized.map(item => item.product_id),
  )
  const summary = buildCartPdfSummary(normalized, quote, subscribeMap)

  return renderInstallmentScheduleToPdfBuffer(schedule, summary)
}

export async function resolveCartComboSnapshot(
  items: InquiryItem[],
  segment: ComboCustomerSegment,
): Promise<InquiryComboSnapshot | null> {
  const normalized = normalizeCartItems(items)
  if (!normalized.length) return null
  const supabase = useSupabaseAdmin()
  return buildInquiryComboSnapshot(supabase, normalized, segment)
}

export function parseCartPdfRequestSegment(value: unknown): ComboCustomerSegment {
  return parseComboCustomerSegment(value)
}
