import type { ProductGroupMember, ProductGroupWithMembers } from '~~/shared/types/product'
import { parseVariantSort } from '~~/shared/utils/productGroupDisplay'

const groupSelect = `
  *,
  category:categories ( id, name, slug ),
  products:products (
    id,
    sku,
    name,
    variant_label,
    variant_sort,
    image_url,
    group_id_locked
  )
`

function sortMembers(products: ProductGroupMember[]) {
  return [...products].sort((a, b) => {
    const sa = a.variant_sort ?? parseVariantSort(a.variant_label) ?? 9999
    const sb = b.variant_sort ?? parseVariantSort(b.variant_label) ?? 9999
    return sa - sb
  })
}

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('product_groups')
    .select(groupSelect)
    .order('sort_order', { ascending: true })
    .order('display_name', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return (data ?? []).map((row) => {
    const products = sortMembers((row.products ?? []) as ProductGroupMember[])
    return { ...row, products } as ProductGroupWithMembers
  })
})
