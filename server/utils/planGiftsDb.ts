import type { PlanGift, PlanGiftEnriched, PlanGiftInput, ProductPlan } from '~~/shared/types/productPlan'

type SupabaseAdmin = ReturnType<typeof useSupabaseAdmin>

type PlanGiftRow = {
  plan_id: string
  product_id: string
  label: string | null
  sort_order: number
}

const giftProductSelect = 'id, name, sku, image_url'

function mapGiftRow(row: PlanGiftRow): PlanGift {
  return {
    product_id: row.product_id,
    label: row.label,
    sort_order: row.sort_order,
  }
}

export function normalizePlanGiftInputs(
  hasGift: boolean | undefined,
  gifts: PlanGiftInput[] | undefined,
): PlanGift[] {
  if (!hasGift) return []
  return (gifts ?? [])
    .filter(g => g.product_id)
    .map((gift, index) => ({
      product_id: gift.product_id,
      label: gift.label?.trim() || null,
      sort_order: gift.sort_order ?? index,
    }))
}

export async function fetchGiftsByPlanIds(
  supabase: SupabaseAdmin,
  planIds: string[],
): Promise<Map<string, PlanGiftEnriched[]>> {
  const result = new Map<string, PlanGiftEnriched[]>()
  if (!planIds.length) return result

  const { data: giftRows, error } = await supabase
    .from('plan_gifts')
    .select('plan_id, product_id, label, sort_order')
    .in('plan_id', planIds)
    .order('sort_order', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  const rows = (giftRows ?? []) as PlanGiftRow[]
  const productIds = [...new Set(rows.map(row => row.product_id))]
  const productById = new Map<string, Record<string, unknown>>()

  if (productIds.length) {
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select(giftProductSelect)
      .in('id', productIds)

    if (prodErr) throw createError({ statusCode: 500, message: prodErr.message })
    for (const row of products ?? []) {
      productById.set(row.id as string, row as Record<string, unknown>)
    }
  }

  for (const row of rows) {
    const product = productById.get(row.product_id)
    const enriched: PlanGiftEnriched = {
      ...mapGiftRow(row),
      product: product
        ? {
            id: product.id as string,
            name: product.name as string,
            sku: product.sku as string,
            image_url: typeof product.image_url === 'string' ? product.image_url : null,
          }
        : null,
    }
    const list = result.get(row.plan_id) ?? []
    list.push(enriched)
    result.set(row.plan_id, list)
  }

  return result
}

export async function attachGiftsToPlans(
  supabase: SupabaseAdmin,
  plans: ProductPlan[],
) {
  const giftsByPlan = await fetchGiftsByPlanIds(supabase, plans.map(p => p.id))
  for (const plan of plans) {
    plan.gift_items = giftsByPlan.get(plan.id) ?? []
  }
}

export async function replacePlanGifts(
  supabase: SupabaseAdmin,
  planId: string,
  gifts: PlanGift[],
) {
  const { error: deleteErr } = await supabase
    .from('plan_gifts')
    .delete()
    .eq('plan_id', planId)

  if (deleteErr) throw createError({ statusCode: 500, message: deleteErr.message })
  if (!gifts.length) return

  const rows = gifts.map(gift => ({
    plan_id: planId,
    product_id: gift.product_id,
    label: gift.label,
    sort_order: gift.sort_order,
  }))

  const { error: insertErr } = await supabase.from('plan_gifts').insert(rows)
  if (insertErr) throw createError({ statusCode: 400, message: insertErr.message })
}
