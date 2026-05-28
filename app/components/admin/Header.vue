<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <header class="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
    <h1 class="text-lg font-semibold text-gray-800">{{ title }}</h1>

    <div class="flex items-center gap-2">
      <!-- Notification bell -->
      <button class="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors">
        <Icon name="heroicons:bell" class="h-5 w-5" />
        <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
      </button>

      <!-- User -->
      <div class="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer">
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-600">
          AD
        </div>
        <div class="text-left">
          <p class="text-sm font-medium text-gray-700 leading-tight">Admin</p>
          <p class="text-xs text-gray-400 leading-tight">admin@lgsubscribe.com</p>
        </div>
        <Icon name="heroicons:chevron-down" class="h-3.5 w-3.5 text-gray-400" />
      </div>
    </div>
  </header>
</template>
