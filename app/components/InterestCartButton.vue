<script setup lang="ts">
const cart = useInterestCart()
</script>

<template>
  <button
    type="button"
    class="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
    aria-label="รายการสนใจผ่อน"
    @click="cart.togglePanel()"
  >
    <Icon name="heroicons:shopping-bag" class="h-5 w-5" />
    <span
      v-if="cart.count.value"
      class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ea1917] px-1 text-[10px] font-bold text-white"
    >
      {{ cart.count.value > 99 ? '99+' : cart.count.value }}
    </span>
  </button>
</template>
