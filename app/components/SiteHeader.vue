<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/page-meta'

const route = useRoute()
const pageBreadcrumb = useState<BreadcrumbItem[] | null>('page-breadcrumb', () => null)

const navLinks = [
  { label: 'สินค้า', to: '/products' },
  { label: 'โปรโมชั่น', to: '/promotions' },
]

const breadcrumbs = computed(() => {
  if (pageBreadcrumb.value?.length) return pageBreadcrumb.value
  const items = route.meta.breadcrumb as BreadcrumbItem[] | undefined
  return items?.length ? items : null
})

function isNavActive(to: string) {
  if (to === '/products') return route.path.startsWith('/products')
  if (to === '/promotions') return route.path.startsWith('/promotions')
  return route.path === to
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
      <NuxtLink to="/" class="shrink-0 text-lg font-bold text-gray-900">
        LG Subscribe
      </NuxtLink>

      <nav class="hidden items-center gap-1 md:flex">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="rounded-full px-4 py-2 text-sm font-medium transition"
          :class="isNavActive(link.to)
            ? 'bg-red-50 text-red-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="flex shrink-0 items-center gap-2 sm:gap-3">
        <InterestCartButton />
        <SiteHeaderAuth />
      </div>
    </div>

    <nav
      v-if="breadcrumbs"
      class="border-t border-gray-100 px-4 py-2 text-sm text-gray-600 sm:px-6"
    >
      <template v-for="(item, i) in breadcrumbs" :key="`${item.label}-${i}`">
        <NuxtLink v-if="item.to" :to="item.to" class="hover:text-red-600">{{ item.label }}</NuxtLink>
        <span v-else class="text-gray-900">{{ item.label }}</span>
        <span v-if="i < breadcrumbs.length - 1" class="mx-2">/</span>
      </template>
    </nav>

    <nav v-else class="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition"
        :class="isNavActive(link.to)
          ? 'bg-red-50 text-red-600'
          : 'text-gray-600 hover:bg-gray-100'"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>
  </header>
</template>
