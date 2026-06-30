import {
  buildCartInstallmentSchedulePdf,
  CART_INSTALLMENT_PDF_FILENAME,
} from '~~/server/utils/cartInstallmentSchedulePdf'
import { isMailConfigured, sendMail } from '~~/server/utils/mailer'
import type { InquiryItem } from '~~/shared/types/inquiry'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TEST_ITEMS: InquiryItem[] = [{
  product_id: 'test-product',
  plan_id: 'test-plan',
  sku: 'TEST-PDF',
  name: 'ทดสอบส่ง PDF ตารางผ่อน — LG Subscribe',
  monthly_price: 1290,
  image_url: null,
  policy_code: 'TEST',
  contract_label: '5Y',
  service_mode: 'visit',
  service_interval_months: 12,
  contract_years: 5,
  contract_months: 60,
  billing_tiers: [{ bill_from: 1, bill_to: 60, monthly_price: 1290 }],
  advance_amount: null,
  advance_note: null,
  display_monthly_price: 1290,
  display_price_note: null,
  quantity: 1,
}]

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = body.email?.trim().toLowerCase() ?? ''
  if (!email || !EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, message: 'กรุณาระบุอีเมลที่ถูกต้อง' })
  }

  if (!isMailConfigured()) {
    throw createError({
      statusCode: 503,
      message: 'ยังไม่พร้อม — ตั้งค่า ThaiBulkSMS Email หรือ SMTP ใน .env แล้วรีสตาร์ทเซิร์ฟเวอร์',
    })
  }

  const pdf = await buildCartInstallmentSchedulePdf(TEST_ITEMS, null)
  const siteUrl = useRuntimeConfig().public.siteUrl || 'https://www.lgsubscribe.com'
  const subject = 'ทดสอบ — ตารางชำระรายเดือน LG Subscribe'
  const text = [
    'ทดสอบส่งอีเมล PDF ตารางผ่อนจาก LG Subscribe',
    '',
    'ไฟล์ PDF ตารางชำระรายเดือนตัวอย่างแนบมาพร้อมอีเมลฉบับนี้',
    '',
    `ดูสินค้าเพิ่มเติม: ${siteUrl}/products`,
  ].join('\n')

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

  return {
    ok: true,
    message: `ส่ง PDF ทดสอบไปที่ ${email} แล้ว`,
  }
})
