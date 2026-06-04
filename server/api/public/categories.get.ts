import type { Category } from '~~/shared/types/category'
import type { MainCategory } from '~~/shared/types/main-category'
import { categoriesGroupedByMain } from '~~/shared/utils/categoryDisplay'

export type PublicCategoryGroup = {
  main: Pick<MainCategory, 'id' | 'name' | 'slug' | 'sort_order'>
  categories: Pick<Category, 'id' | 'name' | 'slug' | 'sort_order'>[]
}

export default defineEventHandler(async (): Promise<PublicCategoryGroup[]> => {
  const supabase = useSupabaseAdmin()

  const [mainResult, categoryResult] = await Promise.all([
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
  ])

  if (mainResult.error) {
    throw createError({ statusCode: 500, message: mainResult.error.message })
  }
  if (categoryResult.error) {
    throw createError({ statusCode: 500, message: categoryResult.error.message })
  }

  const mains = (mainResult.data ?? []) as MainCategory[]
  const categories = (categoryResult.data ?? []) as Category[]

  return categoriesGroupedByMain(mains, categories, { onlyActive: true }).map(g => ({
    main: {
      id: g.main.id,
      name: g.main.name,
      slug: g.main.slug,
      sort_order: g.main.sort_order,
    },
    categories: g.categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      sort_order: c.sort_order,
    })),
  }))
})
