import type { Category } from '../types/category'
import type { MainCategory } from '../types/main-category'

function compareSortOrderThenName<T extends { sort_order: number, name: string }>(a: T, b: T) {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
  return a.name.localeCompare(b.name, 'th')
}

/** main_categories: sort_order → ชื่อ (ไทย) */
export function sortMainCategories(mains: MainCategory[]) {
  return [...mains].sort(compareSortOrderThenName)
}

/** categories ในหมวดเดียวกัน: sort_order → ชื่อ (ไทย) */
export function sortCategories(list: Category[]) {
  return [...list].sort(compareSortOrderThenName)
}

/** หมวดย่อยภายใต้ main category หนึ่ง — ลำดับมาตรฐาน */
export function categoriesForMain(list: Category[], mainId: string) {
  return sortCategories(list.filter(c => c.main_category_id === mainId))
}

export type CategoryGroup = {
  main: MainCategory
  categories: Category[]
}

/** จัดกลุ่มตาม main (เรียง main ก่อน) แล้วเรียงหมวดย่อยในแต่ละกลุ่ม */
export function categoriesGroupedByMain(
  mains: MainCategory[],
  categories: Category[],
  options?: { onlyActive?: boolean },
) {
  const onlyActive = options?.onlyActive ?? false
  return sortMainCategories(mains)
    .map(main => ({
      main,
      categories: categoriesForMain(
        onlyActive ? categories.filter(c => c.is_active) : categories,
        main.id,
      ),
    }))
    .filter(g => g.categories.length > 0)
}

/** รายการหมวดแบบ flat ตามลำดับที่แสดงใน UI (main → หมวดย่อย) */
export function categoriesInDisplayOrder(
  mains: MainCategory[],
  categories: Category[],
  options?: { onlyActive?: boolean },
) {
  return categoriesGroupedByMain(mains, categories, options).flatMap(g => g.categories)
}

export function defaultCategoryId(mains: MainCategory[], categories: Category[]) {
  return categoriesInDisplayOrder(mains, categories, { onlyActive: true })[0]?.id ?? ''
}
