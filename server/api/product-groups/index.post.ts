import type { ProductGroupInput } from '~~/shared/types/product'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody<ProductGroupInput>(event)

  if (!body.display_name?.trim()) {
    throw createError({ statusCode: 400, message: 'display_name จำเป็นต้องมี' })
  }
  if (!body.category_id) {
    throw createError({ statusCode: 400, message: 'ต้องเลือก category' })
  }

  const supabase = useSupabaseAdmin()

  const { data: maxRow } = await supabase
    .from('product_groups')
    .select('sort_order')
    .eq('category_id', body.category_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = (maxRow?.sort_order ?? -1) + 1
  const groupKey = `manual:${randomUUID()}`

  const { data: group, error } = await supabase
    .from('product_groups')
    .insert({
      group_key: groupKey,
      display_name: body.display_name.trim(),
      category_id: body.category_id,
      sort_order: sortOrder,
      is_active: true,
    })
    .select(`
      *,
      category:categories ( id, name, slug )
    `)
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  const productIds = body.product_ids?.filter(Boolean) ?? []
  if (productIds.length) {
    const { error: memberErr } = await supabase
      .from('products')
      .update({ group_id: group.id, group_id_locked: true })
      .in('id', productIds)

    if (memberErr) throw createError({ statusCode: 400, message: memberErr.message })
  }

  return { ...group, products: [] }
})
