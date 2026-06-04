import type { Category } from '~~/shared/types/category'
import type { HomeCategoryCard } from '~~/shared/types/homeCategory'
import type { MainCategory } from '~~/shared/types/main-category'
import { categoriesInDisplayOrder } from '~~/shared/utils/categoryDisplay'

export type { HomeCategoryCard }

type ProductImageRow = {
  category_id: string
  name: string
  sort_order: number
  image_url: string | null
  image_urls: string[] | null
}

function imageFromRow(row: ProductImageRow) {
  const urls = Array.isArray(row.image_urls)
    ? row.image_urls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    : []
  return urls[0] || row.image_url?.trim() || null
}

/** รูปจากสินค้า published ตัวแรกในหมวด (sort_order → ชื่อ) */
function firstProductImageForCategory(categoryId: string, products: ProductImageRow[]) {
  const inCategory = products
    .filter(p => p.category_id === categoryId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'th'))

  for (const product of inCategory) {
    const url = imageFromRow(product)
    if (url) return url
  }
  return null
}

export default defineEventHandler(async (): Promise<HomeCategoryCard[]> => {
  const supabase = useSupabaseAdmin()

  const [mainResult, categoryResult, productResult] = await Promise.all([
    supabase
      .from('main_categories')
      .select('id, name, slug, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('categories')
      .select('id, name, slug, sort_order, is_active, main_category_id')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('products')
      .select('category_id, name, sort_order, image_url, image_urls')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
  ])

  if (mainResult.error) {
    throw createError({ statusCode: 500, message: mainResult.error.message })
  }
  if (categoryResult.error) {
    throw createError({ statusCode: 500, message: categoryResult.error.message })
  }
  if (productResult.error) {
    throw createError({ statusCode: 500, message: productResult.error.message })
  }

  const mains = (mainResult.data ?? []) as MainCategory[]
  const categories = (categoryResult.data ?? []) as Category[]
  const products = (productResult.data ?? []) as ProductImageRow[]

  const ordered = categoriesInDisplayOrder(mains, categories, { onlyActive: true })

  return ordered.flatMap((category) => {
    const imageUrl = firstProductImageForCategory(category.id, products)
    if (!imageUrl) return []
    return [{
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl,
    }]
  })
})
