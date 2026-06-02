import type { ProductGroupMembersPatch } from '~~/shared/types/product'

export default defineEventHandler(async (event) => {
  const groupId = getRouterParam(event, 'id')
  if (!groupId) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<ProductGroupMembersPatch>(event)
  const add = body.add?.filter(Boolean) ?? []
  const remove = body.remove?.filter(Boolean) ?? []
  const variantLabels = body.variant_labels ?? {}

  if (!add.length && !remove.length) {
    throw createError({ statusCode: 400, message: 'ต้องส่ง add หรือ remove' })
  }

  const supabase = useSupabaseAdmin()

  const { data: group, error: groupErr } = await supabase
    .from('product_groups')
    .select('id')
    .eq('id', groupId)
    .maybeSingle()

  if (groupErr) throw createError({ statusCode: 500, message: groupErr.message })
  if (!group) throw createError({ statusCode: 404, message: 'ไม่พบกลุ่มสินค้า' })

  if (remove.length) {
    const { error } = await supabase
      .from('products')
      .update({
        group_id: null,
        group_id_locked: true,
      })
      .eq('group_id', groupId)
      .in('id', remove)

    if (error) throw createError({ statusCode: 400, message: error.message })
  }

  for (const productId of add) {
    const patch: Record<string, unknown> = {
      group_id: groupId,
      group_id_locked: true,
    }
    const label = variantLabels[productId]
    if (label !== undefined) {
      patch.variant_label = label.trim() || null
    }

    const { error } = await supabase
      .from('products')
      .update(patch)
      .eq('id', productId)

    if (error) throw createError({ statusCode: 400, message: error.message })
  }

  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('id, sku, name, variant_label, variant_sort, image_url, group_id_locked')
    .eq('group_id', groupId)

  if (fetchErr) throw createError({ statusCode: 500, message: fetchErr.message })

  return { group_id: groupId, products: products ?? [] }
})
