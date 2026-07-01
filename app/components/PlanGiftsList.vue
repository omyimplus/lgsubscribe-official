<script setup lang="ts">
import type { PlanGiftDisplayItem } from '~~/shared/utils/planGiftDisplay'
import { planGiftDisplayLabel } from '~~/shared/utils/planGiftDisplay'

withDefaults(defineProps<{
  gifts: PlanGiftDisplayItem[]
  compact?: boolean
}>(), {
  compact: false,
})
</script>

<template>
  <ul
    v-if="gifts.length"
    class="space-y-1"
    :class="compact ? 'text-xs text-amber-800' : 'rounded-xl border border-amber-100 bg-amber-50/60 p-3'"
  >
    <li v-if="!compact" class="text-xs font-semibold uppercase tracking-wide text-amber-800">ของแถม</li>
    <li
      v-for="(gift, index) in gifts"
      :key="`${gift.product_id}-${index}`"
      class="flex items-start gap-2"
      :class="compact ? '' : 'text-sm text-gray-800'"
    >
      <Icon name="heroicons:gift" class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <span>
        <span class="font-medium">{{ planGiftDisplayLabel(gift) }}</span>
        <span
          v-if="('product' in gift && gift.product?.sku) || ('sku' in gift && gift.sku)"
          class="ml-1 font-mono text-[11px] text-gray-500"
        >{{ ('product' in gift ? gift.product?.sku : gift.sku) }}</span>
      </span>
    </li>
  </ul>
</template>
