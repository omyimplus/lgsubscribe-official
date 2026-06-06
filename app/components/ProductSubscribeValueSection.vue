<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import {
  hasSubscribeBenefitsImage,
  hasSubscribeValueTabs,
  normalizeSubscribeValueTabs,
  sumSubscribeValueItems,
} from '~~/shared/utils/productSubscribeValue'

const props = defineProps<{
  product: Product
}>()

const benefitsImage = computed(() => props.product.subscribe_benefits_image_url?.trim() || '')
const items = computed(() => normalizeSubscribeValueTabs(props.product.subscribe_value_tabs))
const showBenefitsImage = computed(() => hasSubscribeBenefitsImage(benefitsImage.value))
const showTabs = computed(() => hasSubscribeValueTabs(items.value))
const showSection = computed(() => showBenefitsImage.value || showTabs.value)
const totalValue = computed(() => sumSubscribeValueItems(items.value))

function formatNumber(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('th-TH').format(n)
}

function formatValueBaht(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return 'มูลค่า —'
  return `มูลค่า ${formatNumber(n)} บาท`
}
</script>

<template>
  <section
    v-if="showSection"
    class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
  >
    <h2 class="text-lg font-semibold text-[#ea1917] sm:text-xl">
      Subscribe ได้อะไรมากกว่าที่คุณคิด
    </h2>

    <div
      v-if="showBenefitsImage"
      class="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
    >
      <img
        :src="benefitsImage"
        alt="Subscribe ได้อะไรมากกว่าที่คุณคิด"
        class="w-full object-contain"
      >
    </div>

    <ul v-if="showTabs" class="mt-4 space-y-2">
      <li
        v-for="(item, index) in items"
        :key="`${item.text}-${index}`"
        class="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm"
      >
        <span class="text-gray-800">{{ item.text || `รายการ ${index + 1}` }}</span>
        <span class="shrink-0 font-medium tabular-nums text-gray-900">
          {{ formatValueBaht(item.price) }}
        </span>
      </li>
    </ul>

    <div
      v-if="showTabs"
      class="mt-5 border-t border-dashed border-gray-200 pt-5"
    >
      <div
        class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ea1917] to-[#c41412] px-5 py-4 shadow-md sm:px-6 sm:py-5"
      >
        <div
          class="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl"
          aria-hidden="true"
        />
        <div class="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p class="min-w-0 text-sm font-semibold leading-snug text-white sm:text-base">
            รวมมูลค่า Subscribe ที่ได้รับโดยประมาณ
          </p>
          <p class="shrink-0 text-right text-xl font-bold tabular-nums text-white sm:text-2xl">
            {{ formatNumber(totalValue) }}
            <span class="text-sm font-semibold sm:text-base"> บาท</span>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
