<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import { productWarrantyLine } from '~/composables/useProductCardText'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  subscribe: [product: Product]
  compare: [product: Product, checked: boolean]
}>()

const compared = ref(false)
const copied = ref(false)

const monthlyPrice = computed(() =>
  props.product.discounted_price ?? props.product.base_price,
)

const showStrikethroughPrice = computed(() => {
  const full = props.product.full_price
  return full != null && full > monthlyPrice.value
})

const warrantyText = computed(() => productWarrantyLine(props.product))

const promoText = computed(() => props.product.headline || 'ยิ่งซับมาก ยิ่งลดมาก!')

async function copySku() {
  try {
    await navigator.clipboard.writeText(props.product.sku)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  }
  catch {
    /* ignore */
  }
}

function onCompareChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  compared.value = checked
  emit('compare', props.product, checked)
}
</script>

<template>
  <article
    class="flex h-full flex-col rounded-sm border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
  >
    <div class="mb-3">
      <span
        class="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-semibold text-white"
      >
        Subscription
      </span>
    </div>

    <NuxtLink
      :to="`/products/${product.id}`"
      class="mb-2 text-sm font-normal text-gray-900 underline decoration-gray-400 underline-offset-2 hover:text-red-600"
    >
      {{ product.name }}
    </NuxtLink>

    <div class="mb-4 flex items-center gap-2 text-xs text-gray-600">
      <span class="font-medium tracking-wide">{{ product.sku }}</span>
      <button
        type="button"
        class="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        :title="copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'"
        @click.prevent="copySku"
      >
        <Icon :name="copied ? 'heroicons:check' : 'heroicons:clipboard-document'" class="h-3.5 w-3.5" />
      </button>
    </div>

    <div class="relative mb-4 flex flex-1 items-center justify-center py-2">
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        class="max-h-44 w-full object-contain"
      >
      <div v-else class="flex h-44 w-full items-center justify-center bg-gray-50">
        <Icon name="heroicons:photo" class="h-12 w-12 text-gray-300" />
      </div>
    </div>

    <p class="mb-1 text-sm font-medium text-red-600">
      {{ promoText }}
    </p>

    <div class="flex flex-wrap items-baseline gap-2">
      <p class="text-3xl font-bold tracking-tight text-gray-900">
        {{ formatBaht(monthlyPrice) }}
      </p>
      <p
        v-if="showStrikethroughPrice"
        class="text-base text-gray-400 line-through"
      >
        {{ formatBaht(product.full_price!) }}
      </p>
    </div>

    <div class="mt-1 space-y-0.5 text-xs text-gray-600">
      <p>{{ warrantyText }}</p>
      <p v-if="product.subscription_note">
        {{ product.subscription_note }}
      </p>
    </div>

    <component
      :is="product.purchase_only_url ? 'a' : 'span'"
      :href="product.purchase_only_url || undefined"
      class="mt-0.5 inline-block text-xs text-gray-900 underline decoration-gray-400 hover:text-red-600"
    >
      {{ product.purchase_only_label || 'หรือซื้อเฉพาะสินค้าเท่านั้น' }}
    </component>

    <div class="mt-5 flex items-end justify-between gap-2 border-t border-gray-100 pt-4">
      <NuxtLink
        :to="`/products/${product.id}`"
        class="text-sm text-gray-900 hover:text-red-600"
      >
        เรียนรู้เพิ่มเติม &gt;
      </NuxtLink>

      <div class="flex flex-col items-end gap-2">
        <button
          type="button"
          class="min-w-[120px] rounded-full bg-[#ea1917] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          @click="emit('subscribe', product)"
        >
          Subscribe
        </button>
        <label class="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
          <input
            type="checkbox"
            class="h-3.5 w-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
            :checked="compared"
            @change="onCompareChange"
          >
          เปรียบเทียบ
        </label>
      </div>
    </div>
  </article>
</template>
