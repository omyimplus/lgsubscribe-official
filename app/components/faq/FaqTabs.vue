<script setup lang="ts">
import type { FaqItem } from '~~/shared/types/faqItem'

const props = defineProps<{
  items: FaqItem[]
}>()

const activeId = ref<string | null>(null)

watch(
  () => props.items,
  (list) => {
    if (!list.length) {
      activeId.value = null
      return
    }
    if (!list.some(i => i.id === activeId.value)) {
      activeId.value = list[0]!.id
    }
  },
  { immediate: true },
)

const activeItem = computed(() =>
  props.items.find(i => i.id === activeId.value) ?? props.items[0] ?? null,
)

const bodyRef = ref<HTMLElement | null>(null)
useEmbeddedVideos(bodyRef, () => activeItem.value?.body_html)
</script>

<template>
  <div v-if="!items.length" class="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-gray-500">
    ยังไม่มี FAQ
  </div>

  <div v-else class="flex flex-col gap-6 lg:flex-row lg:items-start">
    <div
      class="flex gap-2 overflow-x-auto pb-1 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0"
      role="tablist"
      aria-label="หมวด FAQ"
    >
      <button
        v-for="tab in items"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="tab.id === activeId"
        class="shrink-0 rounded-xl px-4 py-3 text-left text-sm font-medium transition lg:w-full"
        :class="tab.id === activeId
          ? 'bg-[#ea1917] text-white shadow-sm'
          : 'border border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-[#ea1917]'"
        @click="activeId = tab.id"
      >
        {{ tab.tab_title }}
      </button>
    </div>

    <div
      v-if="activeItem"
      class="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
      role="tabpanel"
    >
      <h2 class="text-lg font-bold text-gray-900 sm:text-xl">
        {{ activeItem.tab_title }}
      </h2>
      <div
        v-if="activeItem.body_html"
        ref="bodyRef"
        class="faq-body storefront-rich-html prose prose-sm mt-4 max-w-none text-gray-700 sm:prose-base"
        v-html="activeItem.body_html"
      />
      <p v-else class="mt-4 text-gray-500">ยังไม่มีเนื้อหาในแท็บนี้</p>
    </div>
  </div>
</template>
