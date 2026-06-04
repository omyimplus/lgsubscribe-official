import type { Category } from '~~/shared/types/category'
import type { Product } from '~~/shared/types/product'
import type { PublicCategoryGroup } from '~~/server/api/public/categories.get'
import { groupProducts } from '~~/shared/utils/productGroupDisplay'
import {
  PRODUCT_LIST_PAGE_SIZE,
  filterProductsByCategoryId,
  filterProductsBySearch,
  isProductSortKey,
  resolveCategoryIdBySlug,
  sortProductDisplayGroups,
  type ProductSortKey,
} from '~~/shared/utils/productListing'

export function useProductListing(products: Ref<Product[] | undefined>) {
  const route = useRoute()
  const router = useRouter()

  const { data: categoryGroups } = useFetch<PublicCategoryGroup[]>('/api/public/categories', {
    key: 'public-category-groups',
    default: () => [],
  })

  const flatCategories = computed(() =>
    (categoryGroups.value ?? []).flatMap(g =>
      g.categories.map(c => ({ ...c, main_category_id: g.main.id })),
    ) as Pick<Category, 'id' | 'name' | 'slug' | 'main_category_id'>[],
  )

  const categorySlug = computed(() => {
    const q = route.query.category
    return typeof q === 'string' ? q.trim() : ''
  })

  const sortKey = computed<ProductSortKey>(() => {
    const q = route.query.sort
    if (typeof q === 'string' && isProductSortKey(q)) return q
    return 'default'
  })

  const searchQuery = computed(() => {
    const q = route.query.q
    return typeof q === 'string' ? q.trim() : ''
  })

  const selectedCategoryId = computed(() =>
    resolveCategoryIdBySlug(categorySlug.value, flatCategories.value),
  )

  const selectedCategoryLabel = computed(() => {
    if (!categorySlug.value) return null
    const cat = flatCategories.value.find(c => c.slug === categorySlug.value)
    return cat?.name ?? null
  })

  const filteredProducts = computed(() => {
    const byCategory = filterProductsByCategoryId(products.value ?? [], selectedCategoryId.value)
    return filterProductsBySearch(byCategory, searchQuery.value)
  })

  const displayGroups = computed(() => {
    const grouped = groupProducts(filteredProducts.value)
    return sortProductDisplayGroups(grouped, sortKey.value)
  })

  const totalGroups = computed(() => displayGroups.value.length)

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(totalGroups.value / PRODUCT_LIST_PAGE_SIZE)),
  )

  const currentPage = computed(() => {
    const raw = route.query.page
    const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : 1
    if (!Number.isFinite(n) || n < 1) return 1
    return Math.min(n, totalPages.value)
  })

  const paginatedGroups = computed(() => {
    const start = (currentPage.value - 1) * PRODUCT_LIST_PAGE_SIZE
    return displayGroups.value.slice(start, start + PRODUCT_LIST_PAGE_SIZE)
  })

  const pageRangeLabel = computed(() => {
    if (!totalGroups.value) return ''
    const from = (currentPage.value - 1) * PRODUCT_LIST_PAGE_SIZE + 1
    const to = Math.min(currentPage.value * PRODUCT_LIST_PAGE_SIZE, totalGroups.value)
    return `${from}–${to} จาก ${totalGroups.value}`
  })

  function buildQuery(patch: { category?: string, sort?: ProductSortKey, page?: number, q?: string }) {
    const next: Record<string, string> = {}
    const cat = patch.category !== undefined ? patch.category : categorySlug.value
    const sort = patch.sort !== undefined ? patch.sort : sortKey.value
    const page = patch.page !== undefined ? patch.page : currentPage.value
    const q = patch.q !== undefined ? patch.q : searchQuery.value
    if (cat) next.category = cat
    if (sort && sort !== 'default') next.sort = sort
    if (q) next.q = q
    if (page > 1) next.page = String(page)
    return next
  }

  function scrollListingToTop() {
    if (!import.meta.client) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function setPage(page: number) {
    const clamped = Math.max(1, Math.min(page, totalPages.value))
    router.replace({ path: '/products', query: buildQuery({ page: clamped }) })
    scrollListingToTop()
  }

  function setCategorySlug(slug: string) {
    router.replace({ path: '/products', query: buildQuery({ category: slug, page: 1 }) })
    scrollListingToTop()
  }

  function setSortKey(key: ProductSortKey) {
    router.replace({ path: '/products', query: buildQuery({ sort: key, page: 1 }) })
    scrollListingToTop()
  }

  function setSearchQuery(q: string) {
    router.push({ path: '/products', query: buildQuery({ q: q.trim(), page: 1 }) })
    scrollListingToTop()
  }

  function clearFilters() {
    router.replace({ path: '/products' })
    scrollListingToTop()
  }

  watch(totalPages, (max) => {
    if (currentPage.value > max) {
      router.replace({ path: '/products', query: buildQuery({ page: max }) })
    }
  })

  return {
    categoryGroups,
    categorySlug,
    sortKey,
    searchQuery,
    selectedCategoryId,
    selectedCategoryLabel,
    filteredProducts,
    displayGroups,
    paginatedGroups,
    totalGroups,
    totalPages,
    currentPage,
    pageRangeLabel,
    pageSize: PRODUCT_LIST_PAGE_SIZE,
    setCategorySlug,
    setSortKey,
    setSearchQuery,
    setPage,
    clearFilters,
  }
}
