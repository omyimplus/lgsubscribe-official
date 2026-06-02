<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import type { ProductDisplayGroup } from '~~/shared/utils/productGroupDisplay'

const props = defineProps<{
  group: ProductDisplayGroup
}>()

const emit = defineEmits<{
  subscribe: [product: Product]
  compare: [product: Product, checked: boolean]
}>()

const selectedIndex = ref(0)
const scheduleOpen = ref(false)

const selected = computed(() => props.group.variants[selectedIndex.value] ?? props.group.variants[0]!)

const hasMultipleVariants = computed(() => props.group.variants.length > 1)

const titleOverride = computed(() =>
  hasMultipleVariants.value ? props.group.displayName : undefined,
)

function swatchLabel(v: Product) {
  const label = v.variant_label?.trim()
  if (label) return label.replace(/\s*inch\s*/i, '"').replace(/\s*นิ้ว\s*/i, '"')
  const m = v.name.match(/(\d+)\s*"/)
  return m ? `${m[1]}"` : v.sku
}

watch(
  () => props.group.variants.map(v => v.id).join(','),
  () => { selectedIndex.value = 0 },
)
</script>

<template>
  <div class="flex h-full flex-col">
    <div
      v-if="hasMultipleVariants"
      class="mb-2 flex flex-wrap items-center gap-1.5"
    >
      <button
        v-for="(v, i) in group.variants"
        :key="v.id"
        type="button"
        class="min-w-[2.75rem] rounded-full border px-2.5 py-1 text-xs font-medium transition"
        :class="i === selectedIndex
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'"
        :title="v.name"
        @click="selectedIndex = i"
      >
        {{ swatchLabel(v) }}
      </button>
    </div>

    <ProductCard
      :key="selected.id"
      :product="selected"
      :title-override="titleOverride"
      class="flex-1"
      @subscribe="emit('subscribe', $event)"
      @compare="(p, c) => emit('compare', p, c)"
    />
  </div>
</template>
