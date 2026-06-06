<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/page-meta'

const route = useRoute()
const pageBreadcrumb = useState<BreadcrumbItem[] | null>('page-breadcrumb', () => null)
const mobileMenuOpen = ref(false)

const navLinks = [
  { label: 'หน้าแรก', to: '/' },
  { label: 'สินค้าทั้งหมด', to: '/products' },
  { label: 'ความน่าเชื่อถือ', to: '/trust' },
  { label: 'ติดต่อเรา', to: '/contact' },
]

const breadcrumbs = computed(() => {
  if (pageBreadcrumb.value?.length) return pageBreadcrumb.value
  const items = route.meta.breadcrumb as BreadcrumbItem[] | undefined
  return items?.length ? items : null
})

function isNavActive(to: string) {
  if (to === '/') return route.path === '/'
  if (to === '/products') return route.path.startsWith('/products')
  return route.path === to || route.path.startsWith(`${to}/`)
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

watch(() => route.path, closeMobileMenu)

watch(mobileMenuOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
})
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-gray-200 bg-white">
    <div class="index-container flex h-16 min-w-0 items-center gap-2 sm:gap-4 lg:h-[4.5rem]">
      <NuxtLink to="/" class="block shrink-0" aria-label="LG Subscribe หน้าแรก">
        <img
          src="/images/logo.webp"
          alt="LG Subscribe"
          class="block h-7 w-auto object-contain sm:h-9"
          width="160"
          height="36"
          fetchpriority="high"
        >
      </NuxtLink>

      <nav class="hidden flex-1 items-center justify-center gap-1 xl:gap-2 lg:flex" aria-label="เมนูหลัก">
        <NuxtLink
          to="/"
          class="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition xl:px-4"
          :class="isNavActive('/')
            ? 'text-[#ea1917]'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'"
        >
          หน้าแรก
        </NuxtLink>
        <NuxtLink
          to="/products"
          class="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition xl:px-4"
          :class="isNavActive('/products')
            ? 'text-[#ea1917]'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'"
        >
          สินค้าทั้งหมด
        </NuxtLink>
        <NuxtLink
          to="/trust"
          class="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition xl:px-4"
          :class="isNavActive('/trust')
            ? 'text-[#ea1917]'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'"
        >
          ความน่าเชื่อถือ
        </NuxtLink>

        <SiteHeaderArticlesMenu variant="desktop" />

        <NuxtLink
          v-for="link in navLinks.slice(3)"
          :key="link.to"
          :to="link.to"
          class="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition xl:px-4"
          :class="isNavActive(link.to)
            ? 'text-[#ea1917]'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2 [&_button]:h-9 [&_button]:w-9 sm:[&_button]:h-10 sm:[&_button]:w-10">
        <SiteHeaderSearch />

        <InterestCartButton />

        <SiteHeaderAuth compact />

        <button
          type="button"
          class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-50 sm:h-10 sm:w-10 lg:hidden"
          :aria-expanded="mobileMenuOpen"
          aria-label="เปิดเมนู"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <Icon :name="mobileMenuOpen ? 'heroicons:x-mark' : 'heroicons:bars-3'" class="h-6 w-6" />
        </button>
      </div>
    </div>

    <div id="site-header-search-anchor" />

    <nav
      v-if="breadcrumbs"
      class="border-t border-gray-100"
    >
      <div class="index-container py-2 text-sm text-gray-600">
        <template v-for="(item, i) in breadcrumbs" :key="`${item.label}-${i}`">
          <NuxtLink v-if="item.to" :to="item.to" class="hover:text-red-600">{{ item.label }}</NuxtLink>
          <span v-else class="text-gray-900">{{ item.label }}</span>
          <span v-if="i < breadcrumbs.length - 1" class="mx-2">/</span>
        </template>
      </div>
    </nav>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 top-16 z-30 bg-black/40 lg:hidden"
        aria-hidden="true"
        @click="closeMobileMenu"
      />
    </Transition>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <nav
        v-if="mobileMenuOpen"
        class="absolute left-0 right-0 top-full z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-gray-200 bg-white px-4 py-3 shadow-lg lg:hidden"
        aria-label="เมนูมือถือ"
      >
        <NuxtLink
          to="/"
          class="block rounded-xl px-4 py-3 text-base font-medium transition"
          :class="isNavActive('/')
            ? 'bg-red-50 text-[#ea1917]'
            : 'text-gray-800 hover:bg-gray-50'"
          @click="closeMobileMenu"
        >
          หน้าแรก
        </NuxtLink>
        <NuxtLink
          to="/products"
          class="block rounded-xl px-4 py-3 text-base font-medium transition"
          :class="isNavActive('/products')
            ? 'bg-red-50 text-[#ea1917]'
            : 'text-gray-800 hover:bg-gray-50'"
          @click="closeMobileMenu"
        >
          สินค้าทั้งหมด
        </NuxtLink>
        <NuxtLink
          to="/trust"
          class="block rounded-xl px-4 py-3 text-base font-medium transition"
          :class="isNavActive('/trust')
            ? 'bg-red-50 text-[#ea1917]'
            : 'text-gray-800 hover:bg-gray-50'"
          @click="closeMobileMenu"
        >
          ความน่าเชื่อถือ
        </NuxtLink>

        <SiteHeaderArticlesMenu variant="mobile" :on-navigate="closeMobileMenu" />

        <NuxtLink
          v-for="link in navLinks.slice(3)"
          :key="link.to"
          :to="link.to"
          class="block rounded-xl px-4 py-3 text-base font-medium transition"
          :class="isNavActive(link.to)
            ? 'bg-red-50 text-[#ea1917]'
            : 'text-gray-800 hover:bg-gray-50'"
          @click="closeMobileMenu"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </Transition>
  </header>
</template>
