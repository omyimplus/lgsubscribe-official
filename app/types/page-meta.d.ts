export type BreadcrumbItem = {
  label: string
  to?: string
}

declare module '#app' {
  interface PageMeta {
    breadcrumb?: BreadcrumbItem[]
    /** false = ไม่แสดง hero ใน layout (เช่น หน้าติดต่อ) */
    showHero?: boolean
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    breadcrumb?: BreadcrumbItem[]
    showHero?: boolean
  }
}

export {}
