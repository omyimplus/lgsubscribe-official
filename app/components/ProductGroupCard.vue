<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import type { ProductDisplayGroup } from '~~/shared/utils/productGroupDisplay'

defineProps<{
  group: ProductDisplayGroup
}>()

const emit = defineEmits<{
  subscribe: [product: Product]
}>()
</script>

<template>
  <ProductStorefrontCard
    :group="group"
    @added-to-cart="emit('subscribe', $event)"
  />
</template>
