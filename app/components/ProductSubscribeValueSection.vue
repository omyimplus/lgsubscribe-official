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
        class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3354] to-[#152842] px-5 py-4 shadow-md sm:px-6 sm:py-5"
      >
        <div
          class="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#ea1917]/20 blur-2xl"
          aria-hidden="true"
        />
        <div class="relative flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs font-medium tracking-wide text-white/70">
              สรุปมูลค่าทั้งหมด
            </p>
            <p class="mt-0.5 text-base font-semibold text-white sm:text-lg">
              รวมมูลค่า
            </p>
          </div>
          <p class="shrink-0 text-right">
            <span class="block text-2xl font-bold leading-none tabular-nums text-white sm:text-3xl">
              {{ formatNumber(totalValue) }}
            </span>
            <span class="mt-1 block text-xs font-medium text-[#ea1917] sm:text-sm">
              บาท
            </span>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
