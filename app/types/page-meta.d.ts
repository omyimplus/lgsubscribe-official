export type BreadcrumbItem = {
  label: string
  to?: string
}

declare module '#app' {
  interface PageMeta {
    breadcrumb?: BreadcrumbItem[]
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    breadcrumb?: BreadcrumbItem[]
  }
}

export {}
