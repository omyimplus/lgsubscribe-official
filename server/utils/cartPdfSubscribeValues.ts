import type { ProductSubscribeValueRow } from '~~/shared/utils/productSubscribeValue'
import { normalizeSubscribeValueTabs } from '~~/shared/utils/productSubscribeValue'

export async function fetchSubscribeValuesForCart(
  productIds: string[],
): Promise<Map<string, ProductSubscribeValueRow[]>> {
  const map = new Map<string, ProductSubscribeValueRow[]>()
  const ids = [...new Set(productIds.filter(Boolean))]
  if (!ids.length) return map

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .select('id, subscribe_value_tabs')
    .in('id', ids)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  for (const row of data ?? []) {
    if (!row?.id) continue
    map.set(row.id, normalizeSubscribeValueTabs(row.subscribe_value_tabs))
  }

  return map
}
