<script setup lang="ts">
import type { InquiryItem } from '~~/shared/types/inquiry'

const props = defineProps<{
  open: boolean
  item: InquiryItem | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function close() {
  emit('update:open', false)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close()
}

watch(() => props.open, (isOpen) => {
  if (!import.meta.client) return
  if (isOpen) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && item"
      class="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="ปิด"
        @click="close"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-item-detail-title"
        class="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        @click.stop
      >
        <div class="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
          <h2 id="cart-item-detail-title" class="text-base font-semibold text-gray-900">
            รายละเอียดที่สั่ง
          </h2>
          <button
            type="button"
            class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="ปิด"
            @click="close"
          >
            <Icon name="heroicons:x-mark" class="h-5 w-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <InquiryItemDetailBody :item="item" />
        </div>

        <div class="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-5">
          <button
            type="button"
            class="w-full rounded-full border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            @click="close"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
