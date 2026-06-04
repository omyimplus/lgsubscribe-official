<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const open = ref(false)
const searchText = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panelId = 'site-header-search-panel'

watch(
  () => route.query.q,
  (q) => {
    searchText.value = typeof q === 'string' ? q : ''
  },
  { immediate: true },
)

watch(() => route.path, () => {
  open.value = false
})

function toggleSearch() {
  open.value = !open.value
  if (open.value) {
    nextTick(() => inputRef.value?.focus())
  }
}

function closeSearch() {
  open.value = false
}

function submitSearch() {
  const q = searchText.value.trim()
  closeSearch()
  router.push({
    path: '/products',
    query: q ? { q } : {},
  })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    closeSearch()
  }
}

function onDocumentClick(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  const panel = document.getElementById(panelId)
  if (triggerRef.value?.contains(target)) return
  if (panel?.contains(target)) return
  closeSearch()
}

if (import.meta.client) {
  watch(open, (isOpen) => {
    if (isOpen) {
      window.addEventListener('keydown', onKeydown)
      document.addEventListener('click', onDocumentClick, true)
    }
    else {
      window.removeEventListener('keydown', onKeydown)
      document.removeEventListener('click', onDocumentClick, true)
    }
  })
}

onUnmounted(() => {
  if (!import.meta.client) return
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onDocumentClick, true)
})
</script>

<template>
  <div ref="triggerRef">
    <button
      type="button"
      class="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-50 hover:text-[#ea1917]"
      :class="open ? 'bg-gray-50 text-[#ea1917]' : ''"
      :aria-expanded="open"
      :aria-controls="panelId"
      aria-label="ค้นหาสินค้า"
      @click="toggleSearch"
    >
      <Icon name="heroicons:magnifying-glass" class="h-5 w-5" />
    </button>
  </div>

  <Teleport to="#site-header-search-anchor">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-if="open"
        :id="panelId"
        class="border-t border-gray-200 bg-gray-50/80"
        role="search"
      >
        <div class="index-container py-3">
          <form class="flex flex-col gap-2 sm:flex-row sm:items-center" @submit.prevent="submitSearch">
            <label class="sr-only" for="site-header-search-input">ค้นหาสินค้า</label>
            <div class="relative min-w-0 flex-1">
              <Icon
                name="heroicons:magnifying-glass"
                class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                id="site-header-search-input"
                ref="inputRef"
                v-model="searchText"
                type="search"
                name="q"
                autocomplete="off"
                placeholder="ค้นหาชื่อสินค้า รหัสสินค้า..."
                class="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ea1917]/40 focus:ring-4 focus:ring-[#ea1917]/10"
              >
            </div>
            <div class="flex shrink-0 gap-2">
              <button
                type="submit"
                class="flex-1 rounded-xl bg-[#ea1917] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#c41412] sm:flex-none"
              >
                ค้นหา
              </button>
              <button
                type="button"
                class="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                @click="closeSearch"
              >
                ปิด
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
