import type { BreadcrumbItem } from '~/types/page-meta'

export function usePageBreadcrumb() {
  const items = useState<BreadcrumbItem[] | null>('page-breadcrumb', () => null)

  function set(breadcrumb: BreadcrumbItem[]) {
    items.value = breadcrumb
  }

  function clear() {
    items.value = null
  }

  onUnmounted(clear)

  return { items, set, clear }
}
