<script setup lang="ts">
const props = defineProps<{
  quantity: number
  min?: number
  max?: number
}>()

const emit = defineEmits<{
  increment: []
  decrement: []
}>()

const minQty = computed(() => props.min ?? 1)
const maxQty = computed(() => props.max ?? 99)
</script>

<template>
  <div class="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50">
    <button
      type="button"
      class="inline-flex h-8 w-8 items-center justify-center rounded-l-lg text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="ลดจำนวน"
      :disabled="quantity <= minQty"
      @click="emit('decrement')"
    >
      <Icon name="heroicons:minus" class="h-4 w-4" />
    </button>
    <span class="min-w-8 px-1 text-center text-sm font-semibold tabular-nums text-gray-900">
      {{ quantity }}
    </span>
    <button
      type="button"
      class="inline-flex h-8 w-8 items-center justify-center rounded-r-lg text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="เพิ่มจำนวน"
      :disabled="quantity >= maxQty"
      @click="emit('increment')"
    >
      <Icon name="heroicons:plus" class="h-4 w-4" />
    </button>
  </div>
</template>
