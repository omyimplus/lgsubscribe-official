<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/page-meta'
import { LP_APPLY_PATH } from '~~/shared/utils/lpApplicationContent'

const route = useRoute()
const pageBreadcrumb = useState<BreadcrumbItem[] | null>('page-breadcrumb', () => null)
const mobileMenuOpen = ref(false)

const navTailLinks = [
  { label: 'ความน่าเชื่อถือ', to: '/trust' },
  { label: 'ติดต่อเรา', to: '/contact' },
]

const navItemClass =
  'whitespace-nowrap rounded-full px-2 py-2 text-sm font-medium transition lg:px-2.5 xl:px-3'

const breadcrumbs = computed(() => {
  if (pageBreadcrumb.value?.length) return pageBreadcrumb.value
  const items = route.meta.breadcrumb as BreadcrumbItem[] | undefined
  return items?.length ? items : null
})

function isNavActive(to: string) {
  if (to === '/') return route.path === '/'
  if (to === '/products') return route.path.startsWith('/products')
  if (to === LP_APPLY_PATH) return route.path.startsWith('/careers')
  return route.path === to || route.path.startsWith(`${to}/`)
}

function navClass(to: string) {
  return isNavActive(to)
    ? 'text-[#ea1917]'
    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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
    <div class="site-header-container flex h-16 min-w-0 items-center gap-1.5 sm:gap-2 lg:h-[4.5rem]">
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

      <nav
        class="hidden min-w-0 flex-1 items-center justify-center gap-0 lg:flex lg:gap-0.5 xl:gap-1"
        aria-label="เมนูหลัก"
      >
        <NuxtLink to="/" :class="[navItemClass, navClass('/')]">
          หน้าแรก
        </NuxtLink>
        <NuxtLink to="/products" :class="[navItemClass, navClass('/products')]">
          สินค้าทั้งหมด
        </NuxtLink>
        <NuxtLink to="/corporate" :class="[navItemClass, navClass('/corporate')]">
          ลูกค้าองค์กร
        </NuxtLink>
        <NuxtLink to="/trust" :class="[navItemClass, navClass('/trust')]">
          ความน่าเชื่อถือ
        </NuxtLink>

        <SiteHeaderArticlesMenu variant="desktop" />

        <NuxtLink
          v-for="link in navTailLinks.slice(1)"
          :key="link.to"
          :to="link.to"
          :class="[navItemClass, navClass(link.to)]"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
        <NuxtLink
          :to="LP_APPLY_PATH"
          class="hidden shrink-0 rounded-full bg-[#ea1917] px-4 py-2.5 text-sm font-semibold leading-none text-white shadow-[0_2px_8px_rgba(234,25,23,0.3)] transition hover:bg-[#d01514] lg:inline-flex"
          :class="isNavActive(LP_APPLY_PATH) ? 'ring-2 ring-[#ea1917]/30 ring-offset-1' : ''"
        >
          ร่วมงานกับเรา
        </NuxtLink>

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
      <div class="site-header-container py-2 text-sm text-gray-600">
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
          :to="LP_APPLY_PATH"
          class="mb-2 block rounded-xl bg-[#ea1917] px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-[#d01514]"
          @click="closeMobileMenu"
        >
          ร่วมงานกับเรา
        </NuxtLink>
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
          to="/corporate"
          class="block rounded-xl px-4 py-3 text-base font-medium transition"
          :class="isNavActive('/corporate')
            ? 'bg-red-50 text-[#ea1917]'
            : 'text-gray-800 hover:bg-gray-50'"
          @click="closeMobileMenu"
        >
          ลูกค้าองค์กร
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
          to="/contact"
          class="block rounded-xl px-4 py-3 text-base font-medium transition"
          :class="isNavActive('/contact')
            ? 'bg-red-50 text-[#ea1917]'
            : 'text-gray-800 hover:bg-gray-50'"
          @click="closeMobileMenu"
        >
          ติดต่อเรา
        </NuxtLink>
      </nav>
    </Transition>
  </header>
</template>
