<script setup lang="ts">
import { ARTICLE_SECTION_NAV, isArticlesMenuActive } from '~~/shared/utils/articleDisplay'

const props = defineProps<{
  variant: 'desktop' | 'mobile'
  /** mobile: ปิด drawer หลังเลือกลิงก์ */
  onNavigate?: () => void
}>()

const route = useRoute()
const open = ref(false)
const mobileExpanded = ref(false)

const isActive = computed(() => isArticlesMenuActive(route.path))

function isItemActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

function close() {
  open.value = false
}

function onPick() {
  close()
  mobileExpanded.value = false
  props.onNavigate?.()
}

watch(() => route.path, close)

function onDocClick(e: MouseEvent) {
  const el = (e.target as HTMLElement)?.closest?.('[data-articles-menu]')
  if (!el) open.value = false
}

onMounted(() => {
  if (props.variant === 'desktop' && import.meta.client) {
    document.addEventListener('click', onDocClick)
  }
})

onUnmounted(() => {
  if (import.meta.client) document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <!-- Desktop dropdown -->
  <div
    v-if="variant === 'desktop'"
    data-articles-menu
    class="relative hidden lg:block"
  >
    <button
      type="button"
      class="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition xl:px-4"
      :class="isActive
        ? 'text-[#ea1917]'
        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'"
      :aria-expanded="open"
      aria-haspopup="true"
      @click.stop="open = !open"
    >
      บทความ
      <Icon
        name="heroicons:chevron-down"
        class="h-4 w-4 transition"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <div
      v-show="open"
      class="absolute left-1/2 top-full z-50 mt-1 min-w-[16rem] -translate-x-1/2 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
      role="menu"
    >
      <NuxtLink
        to="/articles"
        role="menuitem"
        class="block px-4 py-2.5 text-sm font-medium transition"
        :class="route.path === '/articles'
          ? 'bg-red-50 text-[#ea1917]'
          : 'text-gray-800 hover:bg-gray-50'"
        @click="onPick"
      >
        ภาพรวมบทความ
      </NuxtLink>
      <div class="my-1 border-t border-gray-100" />
      <NuxtLink
        v-for="item in ARTICLE_SECTION_NAV"
        :key="item.to"
        :to="item.to"
        role="menuitem"
        class="block px-4 py-2.5 text-sm transition"
        :class="isItemActive(item.to)
          ? 'bg-red-50 font-medium text-[#ea1917]'
          : 'text-gray-700 hover:bg-gray-50'"
        @click="onPick"
      >
        {{ item.label }}
      </NuxtLink>
    </div>
  </div>

  <!-- Mobile accordion -->
  <div v-else data-articles-menu class="lg:hidden">
    <button
      type="button"
      class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition"
      :class="isActive
        ? 'bg-red-50 text-[#ea1917]'
        : 'text-gray-800 hover:bg-gray-50'"
      :aria-expanded="mobileExpanded"
      @click="mobileExpanded = !mobileExpanded"
    >
      บทความ
      <Icon
        name="heroicons:chevron-down"
        class="h-5 w-5 transition"
        :class="mobileExpanded ? 'rotate-180' : ''"
      />
    </button>
    <div v-show="mobileExpanded" class="mb-2 space-y-0.5 pl-2">
      <NuxtLink
        to="/articles"
        class="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        :class="route.path === '/articles' ? 'text-[#ea1917]' : ''"
        @click="onPick"
      >
        ภาพรวมบทความ
      </NuxtLink>
      <NuxtLink
        v-for="item in ARTICLE_SECTION_NAV"
        :key="item.to"
        :to="item.to"
        class="block rounded-lg px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        :class="isItemActive(item.to) ? 'font-medium text-[#ea1917]' : ''"
        @click="onPick"
      >
        {{ item.label }}
      </NuxtLink>
    </div>
  </div>
</template>
