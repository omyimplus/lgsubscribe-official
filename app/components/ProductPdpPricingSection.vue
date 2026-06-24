<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import { formatBaht } from '~/composables/useProductPricing'
import {
  cardMonthlyPrice,
  cardPricePrefix,
  productHasPlanPricing,
} from '~/composables/useProductPlanPricing'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  openPlan: []
  openSchedule: []
}>()

const cart = useInterestCart()

const hasPricing = computed(() => productHasPlanPricing(props.product))
const pricing = computed(() => props.product.plan_pricing)
const monthlyPrice = computed(() => cardMonthlyPrice(pricing.value))
const pricePrefix = computed(() => cardPricePrefix(pricing.value))
const inCart = computed(() => cart.hasProduct(props.product.id))
</script>

<template>
  <section
    v-if="hasPricing"
    class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
  >
    <h2 class="text-lg font-semibold text-gray-900">
      ราคาผ่อน
    </h2>
    <div class="mt-4">
      <p class="flex flex-wrap items-baseline gap-2">
        <span v-if="pricePrefix" class="text-lg font-medium text-gray-600">{{ pricePrefix }}</span>
        <span class="text-3xl font-bold text-[#ea1917]">{{ formatBaht(monthlyPrice!) }}</span>
        <span class="text-sm text-gray-600">/ เดือน</span>
      </p>
      <p v-if="pricing?.display_price_note" class="mt-2 text-sm text-gray-600">
        {{ pricing.display_price_note }}
      </p>
      <span
        v-if="inCart"
        class="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800"
      >
        <Icon name="heroicons:check" class="h-3.5 w-3.5" />
        อยู่ในรายการสนใจผ่อน
      </span>
    </div>

    <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ea1917] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d41715] sm:flex-none"
        @click="emit('openPlan')"
      >
        <Icon name="heroicons:shopping-cart" class="h-5 w-5" />
        เลือกแผน / สนใจผ่อน
      </button>
      <button
        type="button"
        class="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#1e3354]/25 bg-[#1e3354]/5 py-3 text-sm font-semibold text-[#1e3354] transition hover:bg-[#1e3354]/10 sm:flex-none sm:px-6"
        @click="emit('openSchedule')"
      >
        <Icon name="heroicons:table-cells" class="h-5 w-5" />
        ดูตารางผ่อน
      </button>
    </div>
  </section>
</template>
