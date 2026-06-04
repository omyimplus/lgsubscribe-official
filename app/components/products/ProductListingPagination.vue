<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const pageItems = computed(() => {
  const { currentPage, totalPages } = props
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const items: (number | 'ellipsis')[] = [1]
  const left = Math.max(2, currentPage - 1)
  const right = Math.min(totalPages - 1, currentPage + 1)

  if (left > 2) items.push('ellipsis')
  for (let p = left; p <= right; p++) items.push(p)
  if (right < totalPages - 1) items.push('ellipsis')
  items.push(totalPages)
  return items
})

function go(page: number) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return
  emit('update:page', page)
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="mt-8 flex flex-wrap items-center justify-center gap-1.5"
    aria-label="เปลี่ยนหน้าสินค้า"
  >
    <button
      type="button"
      class="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
      :disabled="currentPage <= 1"
      aria-label="หน้าก่อน"
      @click="go(currentPage - 1)"
    >
      <Icon name="heroicons:chevron-left" class="h-5 w-5" />
    </button>

    <template v-for="(item, i) in pageItems" :key="`${item}-${i}`">
      <span
        v-if="item === 'ellipsis'"
        class="px-1 text-sm text-gray-400"
      >…</span>
      <button
        v-else
        type="button"
        class="inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition"
        :class="item === currentPage
          ? 'bg-[#ea1917] text-white shadow-sm'
          : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'"
        :aria-current="item === currentPage ? 'page' : undefined"
        @click="go(item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      type="button"
      class="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
      :disabled="currentPage >= totalPages"
      aria-label="หน้าถัดไป"
      @click="go(currentPage + 1)"
    >
      <Icon name="heroicons:chevron-right" class="h-5 w-5" />
    </button>
  </nav>
</template>
