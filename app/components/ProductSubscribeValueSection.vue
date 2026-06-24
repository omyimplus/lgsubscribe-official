<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import {
  hasSubscribeBenefitsImage,
  hasSubscribeValueTabs,
  normalizeSubscribeValueTabs,
  sumSubscribeValueItems,
} from '~~/shared/utils/productSubscribeValue'

const props = withDefaults(
  defineProps<{
    product: Product
    /** page = บล็อกบน PDP, embedded = ใน dialog แผนผ่อน */
    variant?: 'page' | 'embedded'
  }>(),
  { variant: 'page' },
)

const isEmbedded = computed(() => props.variant === 'embedded')

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
  if (n == null || Number.isNaN(n)) return 'รับฟรี —'
  return `รับฟรี ${formatNumber(n)} บาท`
}
</script>

<template>
  <section
    v-if="showSection"
    :class="isEmbedded
      ? 'space-y-4'
      : 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'"
  >
    <h2
      class="font-semibold text-[#ea1917]"
      :class="isEmbedded ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'"
    >
      Subscribe ได้อะไรมากกว่าที่คุณคิด
    </h2>

    <div
      v-if="showBenefitsImage"
      class="overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
      :class="isEmbedded ? '' : 'mt-4'"
    >
      <img
        :src="benefitsImage"
        alt="Subscribe ได้อะไรมากกว่าที่คุณคิด"
        class="mx-auto h-auto max-h-[28rem] w-full max-w-full min-w-0 object-contain"
      >
    </div>

    <div v-if="showTabs" :class="isEmbedded ? 'space-y-3' : 'mt-4'">
      <h3
        class="font-semibold text-gray-900"
        :class="isEmbedded ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'"
      >
        ส่วนลดทั้งหมด
      </h3>
      <ul class="space-y-2">
        <li
          v-for="(item, index) in items"
          :key="`${item.text}-${index}`"
          class="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm"
          :class="isEmbedded ? 'px-3 py-2.5 text-xs sm:text-sm' : ''"
        >
        <span class="text-gray-800">{{ item.text || `รายการ ${index + 1}` }}</span>
        <span class="shrink-0 font-medium tabular-nums text-gray-900">
          {{ formatValueBaht(item.price) }}
        </span>
      </li>
      </ul>
    </div>

    <div
      v-if="showTabs"
      :class="isEmbedded
        ? 'border-t border-dashed border-gray-200 pt-4'
        : 'mt-5 border-t border-dashed border-gray-200 pt-5'"
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
      <p class="mt-3 text-left text-xs leading-relaxed text-gray-500 sm:text-sm">
        * บริการนี้ไม่มีค่าใช้จ่ายเพิ่มเติม *
      </p>
      <p class="mt-1.5 text-left text-xs leading-relaxed text-gray-500 sm:text-sm">
        * ราคาประเมินดังกล่าวเป็นราคาเบื้องต้น ที่อ้างอิงข้อมูลจาก LG.com ซึ่งอาจมีการปรับเปลี่ยนตามโปรโมชั่น บริษัทฯ ขอสงวนสิทธิ์ในการปรับเปลี่ยนโดยไม่ต้องแจ้งให้ทราบล่วงหน้า *
      </p>
    </div>
  </section>
</template>
