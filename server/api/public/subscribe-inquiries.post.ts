import type { InquiryItem, SubscriptionInquiryInput } from '~~/shared/types/inquiry'
import {
  formatContactDisplayName,
  validateInquiryContactForm,
} from '~~/shared/utils/inquiryForm'
import type { Product } from '~~/shared/types/product'
import { getOptionalAuthUserFromEvent } from '~~/server/utils/authUser'
import { buildInquiryComboSnapshot, parseComboCustomerSegment } from '~~/server/utils/comboInquiry'
import { buildLineSummary } from '~~/shared/utils/inquiryLineSummary'
import { isLineConfigured, parseNotifyUserIds, sendLinePush } from '~~/server/utils/lineMessaging'
import { fetchProductPlanById } from '~~/server/utils/productPlansDb'
import { fetchDefaultPlanPricingSummaries, planToInquirySnapshot } from '~~/server/utils/productPlanStorefront'
import { mapProduct, productSelect } from '~~/server/utils/productDb'

export default defineEventHandler(async (event) => {
  const body = await readBody<SubscriptionInquiryInput>(event)

  const validated = validateInquiryContactForm({
    applicant_type: body.applicant_type ?? 'individual',
    first_name: body.first_name ?? body.contact_name,
    last_name: body.last_name,
    contact_phone: body.contact_phone,
    address_line: body.address_line,
    subdistrict: body.subdistrict,
    district: body.district,
    province: body.province,
    postal_code: body.postal_code,
    company_name: body.company_name,
    company_registration: body.company_registration,
    security_code: body.security_code,
    security_code_expected: body.security_code_expected,
  })

  if (!validated.ok) {
    throw createError({ statusCode: 400, message: validated.message })
  }

  const contactProfile = validated.profile
  const contactName = formatContactDisplayName(contactProfile)
  const contactPhone = contactProfile.contact_phone

  const rawCartItems = body.items?.length
    ? body.items
    : (body.product_ids ?? []).map(product_id => ({ product_id, plan_id: '', quantity: 1 }))

  const cartItemsByKey = new Map<string, { product_id: string, plan_id: string, quantity: number }>()
  for (const entry of rawCartItems) {
    const product_id = entry.product_id?.trim()
    if (!product_id) continue
    const plan_id = entry.plan_id?.trim() ?? ''
    const key = `${product_id}:${plan_id}`
    const qty = Math.max(1, Math.min(99, Math.floor(Number(entry.quantity) || 1)))
    const existing = cartItemsByKey.get(key)
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + qty)
    }
    else {
      cartItemsByKey.set(key, { product_id, plan_id, quantity: qty })
    }
  }
  const cartItems = [...cartItemsByKey.values()]

  const productIds = [...new Set(cartItems.map(i => i.product_id))]
  if (!productIds.length) {
    throw createError({ statusCode: 400, message: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ' })
  }

  const supabase = useSupabaseAdmin()
  const user = await getOptionalAuthUserFromEvent(event)

  const { data: productRows, error: prodErr } = await supabase
    .from('products')
    .select(productSelect)
    .in('id', productIds)
    .eq('status', 'published')
    .eq('is_active', true)

  if (prodErr) throw createError({ statusCode: 500, message: prodErr.message })

  const products = (productRows ?? []).map(row => mapProduct(row) as Product)
  if (products.length !== productIds.length) {
    throw createError({ statusCode: 400, message: 'มีสินค้าที่เลือกไม่พร้อมแสดงหรือไม่พบในระบบ' })
  }

  const byId = new Map(products.map(p => [p.id, p]))
  const defaultSummaries = await fetchDefaultPlanPricingSummaries(supabase, products)

  const items: InquiryItem[] = []

  for (const entry of cartItems) {
    const product = byId.get(entry.product_id)
    if (!product) continue

    let planId = entry.plan_id?.trim() || ''
    if (!planId) {
      planId = defaultSummaries.get(product.id)?.plan_id ?? ''
    }
    if (!planId) {
      throw createError({
        statusCode: 400,
        message: `สินค้า ${product.sku} ยังไม่มีแผนสัญญา — กรุณาติดต่อเจ้าหน้าที่`,
      })
    }

    const plan = await fetchProductPlanById(supabase, product.id, planId)
    if (!plan?.is_active) {
      throw createError({
        statusCode: 400,
        message: `แผนสัญญาของ ${product.sku} ไม่พร้อมใช้งาน`,
      })
    }

    items.push({
      ...planToInquirySnapshot(product, plan),
      quantity: entry.quantity,
    })
  }

  if (!items.length) {
    throw createError({ statusCode: 400, message: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ' })
  }

  const comboSegment = parseComboCustomerSegment(body.combo_customer_segment)
  const comboSnapshot = await buildInquiryComboSnapshot(supabase, items, comboSegment)

  const contact = {
    name: contactName,
    phone: contactPhone,
    applicantType: contactProfile.applicant_type,
    profile: contactProfile,
    lineId: body.contact_line_id?.trim() ?? '',
    note: body.contact_note?.trim() ?? '',
  }

  const { data, error } = await supabase
    .from('subscription_inquiries')
    .insert({
      customer_id: user?.id ?? null,
      applicant_type: contact.applicantType,
      contact_profile: contact.profile,
      contact_name: contact.name,
      contact_phone: contact.phone,
      contact_line_id: contact.lineId,
      contact_note: contact.note,
      items,
      combo_customer_segment: comboSnapshot ? comboSegment : null,
      combo_snapshot: comboSnapshot,
      status: 'new',
    })
    .select('id')
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  const line_summary = buildLineSummary({
    name: contact.name,
    phone: contact.phone,
    lineId: contact.lineId,
    note: contact.note,
    profile: contact.profile,
    applicant_type: contact.applicantType,
  }, items, comboSnapshot)

  if (isLineConfigured()) {
    const pushText = [
      '📩 คำขอสนใจผ่อนใหม่',
      line_summary,
      '',
      `รหัสคำขอ: ${data.id}`,
      'ดูในแอดมิน: /admin/inquiries',
    ].join('\n')
    void sendLinePush(parseNotifyUserIds(), pushText)
  }

  return {
    id: data.id,
    line_summary,
  }
})
