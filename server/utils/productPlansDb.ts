import type {
  CreatePlanInput,
  PlanBillingTier,
  PlanBillingTierInput,
  ProductPlan,
  ProductPlansResponse,
  UpdatePlanInput,
} from '~~/shared/types/productPlan'
import {
  displayPriceForCard,
  totalContractAmount,
  totalNetAmount,
  validateTiersContinuity,
} from '~~/shared/utils/planPricing'

type SupabaseAdmin = ReturnType<typeof useSupabaseAdmin>

const planSelect = `
  *,
  billing_tiers:plan_billing_tiers (*)
`

function toFriendlyPlanError(message: string) {
  if (message.includes('product_plans_contract_service_per_product_idx')) {
    return 'มีแผนสัญญานี้อยู่แล้วสำหรับสินค้านี้ (ระยะสัญญา + ประเภทบริการซ้ำกัน) กรุณาแก้ไขแผนเดิม หรือเปลี่ยนเงื่อนไขก่อนบันทึก'
  }
  if (message.includes('duplicate key value violates unique constraint')) {
    return 'ข้อมูลแผนซ้ำกับที่มีอยู่แล้ว กรุณาตรวจสอบระยะสัญญา ประเภทบริการ และเงื่อนไขที่กรอก'
  }
  if (message.includes('plan_billing_tiers_bill')) {
    return 'ช่วงบิลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบบิลเริ่มและบิลสิ้นสุดของแต่ละช่วง'
  }
  return message
}

function sortTiers(tiers: PlanBillingTier[]): PlanBillingTier[] {
  return [...tiers].sort((a, b) => a.sort_order - b.sort_order || a.bill_from - b.bill_from)
}

function mapTierRow(row: Record<string, unknown>): PlanBillingTier {
  return {
    id: row.id as string,
    plan_id: row.plan_id as string,
    bill_from: Number(row.bill_from),
    bill_to: Number(row.bill_to),
    monthly_price: Number(row.monthly_price),
    note: typeof row.note === 'string' ? row.note : null,
    sort_order: Number(row.sort_order ?? 0),
  }
}

export function mapPlanRow(row: Record<string, unknown>): ProductPlan {
  const rawTiers = row.billing_tiers as Record<string, unknown>[] | undefined
  const billing_tiers = rawTiers ? sortTiers(rawTiers.map(mapTierRow)) : undefined

  const plan: ProductPlan = {
    id: row.id as string,
    product_id: row.product_id as string,
    policy_code: typeof row.policy_code === 'string' ? row.policy_code : null,
    contract_label: row.contract_label as string,
    contract_years: Number(row.contract_years),
    contract_months: Number(row.contract_months),
    service_mode: row.service_mode as ProductPlan['service_mode'],
    service_interval_months: row.service_interval_months != null ? Number(row.service_interval_months) : null,
    sale_type: row.sale_type as ProductPlan['sale_type'],
    list_price: row.list_price != null ? Number(row.list_price) : null,
    promo_price: row.promo_price != null ? Number(row.promo_price) : null,
    advance_amount: row.advance_amount != null ? Number(row.advance_amount) : null,
    advance_note: typeof row.advance_note === 'string' ? row.advance_note : null,
    promo_period_start: typeof row.promo_period_start === 'string' ? row.promo_period_start : null,
    promo_period_end: typeof row.promo_period_end === 'string' ? row.promo_period_end : null,
    is_default: Boolean(row.is_default),
    is_active: Boolean(row.is_active),
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    billing_tiers,
  }

  if (billing_tiers?.length) {
    plan.computed_total = totalContractAmount(billing_tiers)
    plan.computed_net_total = totalNetAmount(plan.computed_total, plan.advance_amount)
    plan.display_monthly_price = displayPriceForCard(billing_tiers)
  }

  return plan
}

function resolveContractMonths(input: Pick<CreatePlanInput, 'contract_years' | 'contract_months'>) {
  return input.contract_months ?? input.contract_years * 12
}

function deriveContractLabel(contractYears: number, serviceMode: ProductPlan['service_mode']) {
  const mode = serviceMode === 'visit'
    ? 'Visit'
    : serviceMode === 'self'
      ? 'Self'
      : 'NoService'
  return `${contractYears}Y_${mode}`
}

function normalizeTierInputs(tiers: PlanBillingTierInput[]): PlanBillingTierInput[] {
  return tiers.map((tier, index) => ({
    bill_from: tier.bill_from,
    bill_to: tier.bill_to,
    monthly_price: tier.monthly_price,
    note: tier.note?.trim() || null,
    sort_order: tier.sort_order ?? index,
  }))
}

function validatePlanInput(
  input: CreatePlanInput | (UpdatePlanInput & { contract_months: number, billing_tiers: PlanBillingTierInput[] }),
) {
  if (!input.billing_tiers?.length) {
    throw createError({ statusCode: 400, message: 'ต้องมีอย่างน้อย 1 ช่วงบิล' })
  }
  if (input.sale_type && input.sale_type !== 'subscription') {
    throw createError({ statusCode: 400, message: 'รองรับเฉพาะ sale_type = subscription' })
  }

  const contractMonths = 'contract_years' in input && input.contract_years != null
    ? resolveContractMonths(input as CreatePlanInput)
    : input.contract_months

  const tierCheck = validateTiersContinuity(normalizeTierInputs(input.billing_tiers), contractMonths)
  if (!tierCheck.ok) {
    throw createError({ statusCode: 400, message: tierCheck.message })
  }
}

async function assertProductExists(supabase: SupabaseAdmin, productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id, default_plan_id')
    .eq('id', productId)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) throw createError({ statusCode: 404, message: 'ไม่พบสินค้า' })
  return data
}

/** แผนเริ่มต้น = แผนที่เปิดใช้งานและ sort_order น้อยที่สุด (ลำดับแรกในตาราง) */
async function reconcileDefaultPlanForProduct(
  supabase: SupabaseAdmin,
  productId: string,
) {
  const { data: activePlans, error } = await supabase
    .from('product_plans')
    .select('id')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  const defaultPlanId = activePlans?.[0]?.id as string | undefined

  const { error: unsetErr } = await supabase
    .from('product_plans')
    .update({ is_default: false })
    .eq('product_id', productId)

  if (unsetErr) throw createError({ statusCode: 500, message: unsetErr.message })

  if (defaultPlanId) {
    const { error: setErr } = await supabase
      .from('product_plans')
      .update({ is_default: true })
      .eq('id', defaultPlanId)

    if (setErr) throw createError({ statusCode: 500, message: setErr.message })
  }

  const { error: productErr } = await supabase
    .from('products')
    .update({ default_plan_id: defaultPlanId ?? null })
    .eq('id', productId)

  if (productErr) throw createError({ statusCode: 500, message: productErr.message })
}

async function replacePlanTiers(
  supabase: SupabaseAdmin,
  planId: string,
  tiers: PlanBillingTierInput[],
) {
  const { error: deleteErr } = await supabase
    .from('plan_billing_tiers')
    .delete()
    .eq('plan_id', planId)

  if (deleteErr) throw createError({ statusCode: 500, message: deleteErr.message })

  const rows = normalizeTierInputs(tiers).map(tier => ({
    plan_id: planId,
    bill_from: tier.bill_from,
    bill_to: tier.bill_to,
    monthly_price: tier.monthly_price,
    note: tier.note ?? null,
    sort_order: tier.sort_order ?? 0,
  }))

  const { error: insertErr } = await supabase.from('plan_billing_tiers').insert(rows)
  if (insertErr) throw createError({ statusCode: 400, message: toFriendlyPlanError(insertErr.message) })
}

export async function fetchProductPlans(
  supabase: SupabaseAdmin,
  productId: string,
  options?: { activeOnly?: boolean, publishedOnly?: boolean, reconcileDefault?: boolean },
): Promise<ProductPlansResponse> {
  let product = await assertProductExists(supabase, productId)

  if (options?.reconcileDefault) {
    await reconcileDefaultPlanForProduct(supabase, productId)
    product = await assertProductExists(supabase, productId)
  }

  if (options?.publishedOnly) {
    const { data: pub, error: pubErr } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('status', 'published')
      .eq('is_active', true)
      .maybeSingle()

    if (pubErr) throw createError({ statusCode: 500, message: pubErr.message })
    if (!pub) throw createError({ statusCode: 404, message: 'ไม่พบสินค้า' })
  }

  let query = supabase
    .from('product_plans')
    .select(planSelect)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (options?.activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, message: error.message })

  return {
    product_id: productId,
    default_plan_id: product.default_plan_id as string | null,
    plans: (data ?? []).map(row => mapPlanRow(row as Record<string, unknown>)),
  }
}

export async function fetchProductPlanById(
  supabase: SupabaseAdmin,
  productId: string,
  planId: string,
): Promise<ProductPlan | null> {
  const { data, error } = await supabase
    .from('product_plans')
    .select(planSelect)
    .eq('product_id', productId)
    .eq('id', planId)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) return null
  return mapPlanRow(data as Record<string, unknown>)
}

export async function createProductPlan(
  supabase: SupabaseAdmin,
  productId: string,
  input: CreatePlanInput,
): Promise<ProductPlan> {
  await assertProductExists(supabase, productId)
  validatePlanInput(input)

  const contractMonths = resolveContractMonths(input)
  const contractLabel = deriveContractLabel(input.contract_years, input.service_mode)
  const row = {
    product_id: productId,
    policy_code: input.policy_code?.trim() || null,
    contract_label: contractLabel,
    contract_years: input.contract_years,
    contract_months: contractMonths,
    service_mode: input.service_mode,
    service_interval_months: input.service_interval_months ?? null,
    sale_type: 'subscription',
    list_price: input.list_price ?? null,
    promo_price: null,
    advance_amount: input.advance_amount ?? null,
    advance_note: input.advance_note?.trim() || null,
    promo_period_start: input.promo_period_start || null,
    promo_period_end: input.promo_period_end || null,
    is_default: false,
    is_active: input.is_active ?? true,
    sort_order: input.sort_order ?? 0,
  }

  const { data: created, error } = await supabase
    .from('product_plans')
    .insert(row)
    .select('id')
    .single()

  if (error) throw createError({ statusCode: 400, message: toFriendlyPlanError(error.message) })

  await replacePlanTiers(supabase, created.id, input.billing_tiers)
  await reconcileDefaultPlanForProduct(supabase, productId)

  const plan = await fetchProductPlanById(supabase, productId, created.id)
  if (!plan) throw createError({ statusCode: 500, message: 'สร้าง plan ไม่สำเร็จ' })
  return plan
}

export async function updateProductPlan(
  supabase: SupabaseAdmin,
  productId: string,
  planId: string,
  input: UpdatePlanInput,
): Promise<ProductPlan> {
  const existing = await fetchProductPlanById(supabase, productId, planId)
  if (!existing) throw createError({ statusCode: 404, message: 'ไม่พบ plan' })

  const merged: CreatePlanInput = {
    policy_code: input.policy_code !== undefined ? input.policy_code : existing.policy_code,
    contract_years: input.contract_years ?? existing.contract_years,
    contract_months: input.contract_months ?? existing.contract_months,
    service_mode: input.service_mode ?? existing.service_mode,
    service_interval_months: input.service_interval_months !== undefined
      ? input.service_interval_months
      : existing.service_interval_months,
    sale_type: 'subscription',
    list_price: input.list_price !== undefined ? input.list_price : existing.list_price,
    promo_price: null,
    advance_amount: input.advance_amount !== undefined ? input.advance_amount : existing.advance_amount,
    advance_note: input.advance_note !== undefined ? input.advance_note : existing.advance_note,
    promo_period_start: input.promo_period_start !== undefined
      ? input.promo_period_start
      : existing.promo_period_start,
    promo_period_end: input.promo_period_end !== undefined
      ? input.promo_period_end
      : existing.promo_period_end,
    is_active: input.is_active ?? existing.is_active,
    sort_order: input.sort_order ?? existing.sort_order,
    billing_tiers: input.billing_tiers ?? existing.billing_tiers ?? [],
  }

  validatePlanInput(merged)
  const contractLabel = deriveContractLabel(merged.contract_years, merged.service_mode)

  const patch = {
    policy_code: merged.policy_code?.trim() || null,
    contract_label: contractLabel,
    contract_years: merged.contract_years,
    contract_months: merged.contract_months,
    service_mode: merged.service_mode,
    service_interval_months: merged.service_interval_months,
    sale_type: 'subscription',
    list_price: merged.list_price,
    promo_price: null,
    advance_amount: merged.advance_amount,
    advance_note: merged.advance_note?.trim() || null,
    promo_period_start: merged.promo_period_start,
    promo_period_end: merged.promo_period_end,
    is_active: merged.is_active,
    sort_order: merged.sort_order,
  }

  const { error } = await supabase
    .from('product_plans')
    .update(patch)
    .eq('id', planId)
    .eq('product_id', productId)

  if (error) throw createError({ statusCode: 400, message: toFriendlyPlanError(error.message) })

  if (input.billing_tiers) {
    await replacePlanTiers(supabase, planId, input.billing_tiers)
  }

  await reconcileDefaultPlanForProduct(supabase, productId)

  const plan = await fetchProductPlanById(supabase, productId, planId)
  if (!plan) throw createError({ statusCode: 500, message: 'อัปเดต plan ไม่สำเร็จ' })
  return plan
}

export async function deleteProductPlan(
  supabase: SupabaseAdmin,
  productId: string,
  planId: string,
  options?: { hard?: boolean },
): Promise<{ deleted: boolean, soft: boolean }> {
  const existing = await fetchProductPlanById(supabase, productId, planId)
  if (!existing) throw createError({ statusCode: 404, message: 'ไม่พบ plan' })

  const hardDelete = options?.hard ?? true
  if (hardDelete) {
    const { error } = await supabase
      .from('product_plans')
      .delete()
      .eq('id', planId)
      .eq('product_id', productId)

    if (error) {
      const { error: softErr } = await supabase
        .from('product_plans')
        .update({ is_active: false, is_default: false })
        .eq('id', planId)
        .eq('product_id', productId)

      if (softErr) throw createError({ statusCode: 400, message: toFriendlyPlanError(softErr.message) })

      await reconcileDefaultPlanForProduct(supabase, productId)
      return { deleted: true, soft: true }
    }

    await reconcileDefaultPlanForProduct(supabase, productId)
    return { deleted: true, soft: false }
  }

  const { error: softErr } = await supabase
    .from('product_plans')
    .update({ is_active: false, is_default: false })
    .eq('id', planId)
    .eq('product_id', productId)

  if (softErr) throw createError({ statusCode: 400, message: toFriendlyPlanError(softErr.message) })

  await reconcileDefaultPlanForProduct(supabase, productId)
  return { deleted: true, soft: true }
}

