import { deriveGroupDisplayName, parseVariantSort } from '~~/shared/utils/productGroupDisplay'

export { deriveGroupDisplayName, parseVariantSort }

export type VariantGroupRow = {
  variant_group_key: string | null
  variant_label: string | null
  name: string
  category_id: string
}

/** สร้าง/อัปเดต product_groups จาก import_products ก่อนนำขึ้น Products */
export async function ensureProductGroupsFromImportBatch(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  batchId: string,
) {
  const { data: rows, error } = await supabase
    .from('import_products')
    .select('variant_group_key, variant_label, name, category_id')
    .eq('batch_id', batchId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const byKey = new Map<string, VariantGroupRow[]>()
  for (const row of rows ?? []) {
    const key = row.variant_group_key?.trim()
    if (!key) continue
    const list = byKey.get(key) ?? []
    list.push(row as VariantGroupRow)
    byKey.set(key, list)
  }

  for (const [groupKey, members] of byKey) {
    const sorted = [...members].sort((a, b) => {
      const sa = parseVariantSort(a.variant_label) ?? 9999
      const sb = parseVariantSort(b.variant_label) ?? 9999
      return sa - sb
    })
    const lead = sorted[0]!
    const displayName = deriveGroupDisplayName(lead.name)

    const { error: upsertErr } = await supabase
      .from('product_groups')
      .upsert({
        group_key: groupKey,
        display_name: displayName,
        category_id: lead.category_id,
        is_active: true,
      }, { onConflict: 'group_key' })

    if (upsertErr) throw createError({ statusCode: 500, message: upsertErr.message })
  }
}

export type CatalogGroup<T extends { sku: string, variant_group_key?: string | null, name: string | null }> = {
  groupKey: string
  displayName: string
  variants: T[]
}

/** จัดกลุ่มรายการ catalog ตาม variant_group_key (ใช้ทั้ง API และ UI) */
export function groupCatalogItems<T extends { sku: string, variant_group_key?: string | null, name: string | null, variant_label?: string | null }>(
  items: T[],
): CatalogGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = item.variant_group_key?.trim() || `sku:${item.sku}`
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }

  const groups: CatalogGroup<T>[] = []
  for (const [groupKey, variants] of map) {
    const sorted = [...variants].sort((a, b) => {
      const sa = parseVariantSort(a.variant_label) ?? 9999
      const sb = parseVariantSort(b.variant_label) ?? 9999
      return sa - sb
    })
    groups.push({
      groupKey,
      displayName: deriveGroupDisplayName(sorted[0]?.name),
      variants: sorted,
    })
  }

  return groups.sort((a, b) => a.displayName.localeCompare(b.displayName, 'th'))
}
