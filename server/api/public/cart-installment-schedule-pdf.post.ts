import type { InquiryItem } from '~~/shared/types/inquiry'
import { getOptionalAuthUserFromEvent } from '~~/server/utils/authUser'
import {
  buildCartInstallmentSchedulePdf,
  CART_INSTALLMENT_PDF_FILENAME,
  parseCartPdfRequestSegment,
  resolveCartComboSnapshot,
} from '~~/server/utils/cartInstallmentSchedulePdf'
import { isMailConfigured, sendMail } from '~~/server/utils/mailer'
import { markCartPdfEmailSent, upsertCartPdfEmailLead } from '~~/server/utils/cartPdfEmailLead'
import { getUserRole } from '~~/server/utils/staffAuth'
import { normalizeCartItems } from '~~/shared/utils/cartQuantity'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type CartInstallmentPdfBody = {
  email?: string
  items?: InquiryItem[]
  combo_customer_segment?: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CartInstallmentPdfBody>(event)
  const items = normalizeCartItems(body.items ?? [])
  if (!items.length) {
    throw createError({ statusCode: 400, message: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ' })
  }

  const segment = parseCartPdfRequestSegment(body.combo_customer_segment)
  const comboSnapshot = await resolveCartComboSnapshot(items, segment)
  const user = await getOptionalAuthUserFromEvent(event)
  const isAdmin = user ? getUserRole(user) === 'admin' : false

  let pdf: Buffer
  try {
    pdf = await buildCartInstallmentSchedulePdf(items, comboSnapshot)
  }
  catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    const message = err instanceof Error ? err.message : 'สร้าง PDF ไม่สำเร็จ'
    throw createError({ statusCode: 500, message })
  }

  if (isAdmin) {
    setResponseHeader(event, 'Content-Type', 'application/pdf')
    setResponseHeader(
      event,
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(CART_INSTALLMENT_PDF_FILENAME)}`,
    )
    return pdf
  }

  const email = body.email?.trim().toLowerCase() ?? ''
  if (!email || !EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, message: 'กรุณากรอกอีเมลที่ถูกต้อง' })
  }

  if (!isMailConfigured()) {
    throw createError({ statusCode: 503, message: 'ระบบส่งอีเมลยังไม่ได้ตั้งค่า กรุณาติดต่อเจ้าหน้าที่' })
  }

  const supabase = useSupabaseAdmin()
  const { id: leadId } = await upsertCartPdfEmailLead(supabase, email)

  const siteUrl = useRuntimeConfig().public.siteUrl || 'https://www.lgsubscribe.com'
  const subject = 'ตารางชำระรายเดือน — LG Subscribe'
  const text = [
    'ขอบคุณที่สนใจบริการ LG Subscribe',
    '',
    'ไฟล์ PDF ตารางชำระรายเดือนตามรายการในตะกร้าของคุณแนบมาพร้อมอีเมลฉบับนี้',
    '',
    `ดูสินค้าเพิ่มเติม: ${siteUrl}/products`,
    '',
    'หากมีคำถาม ติดต่อเจ้าหน้าที่ผ่าน Line Official Account บนเว็บไซต์',
  ].join('\n')

  try {
    await sendMail({
      to: email,
      subject,
      text,
      html: text.replace(/\n/g, '<br>'),
      attachments: [{
        filename: CART_INSTALLMENT_PDF_FILENAME,
        content: pdf,
        contentType: 'application/pdf',
      }],
    })
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'ส่งอีเมลไม่สำเร็จ'
    throw createError({ statusCode: 502, message })
  }

  await markCartPdfEmailSent(supabase, leadId)

  return {
    ok: true,
    id: leadId,
    message: `ส่ง PDF ไปที่ ${email} แล้ว กรุณาตรวจสอบกล่องจดหมาย (รวมถึง Spam)`,
  }
})
