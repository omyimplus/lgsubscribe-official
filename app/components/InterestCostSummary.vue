<script setup lang="ts">
import type { InquiryItem } from '~~/shared/types/inquiry'
import type { ComboQuoteResult } from '~~/shared/utils/comboPricing'
import { getCartItemQuantity } from '~~/shared/utils/cartQuantity'
import { buildDueTodaySummary } from '~~/shared/utils/orderDueToday'

const props = withDefaults(
  defineProps<{
    items: InquiryItem[]
    totalContract: number
    totalNet: number
    comboQuote?: ComboQuoteResult | null
    /** แสดงปุ่มเปิดภาพรวมตลอดสัญญา */
    showContractToggle?: boolean
    /** ซ่อนหัวข้อในการ์ด (ใช้เมื่อหน้าแม่มีหัวข้อแล้ว) */
    hideHeading?: boolean
    /** แสดงกล่องงวด 1–2 combo (ปิดเมื่อแม่มีส่วน Combo แยกแล้ว) */
    showComboInstallment?: boolean
  }>(),
  { showContractToggle: true, comboQuote: null, hideHeading: false, showComboInstallment: true },
)

const contractAfterCombo = computed(() => {
  if (!props.comboQuote) return props.totalContract
  const advance = props.items.reduce(
    (s, i) => s + (Number(i.advance_amount) || 0) * getCartItemQuantity(i),
    0,
  )
  return props.comboQuote.order_total_charged + advance
})

const netAfterCombo = computed(() => {
  if (!props.comboQuote) return props.totalNet
  return contractAfterCombo.value
})

const dueToday = computed(() => buildDueTodaySummary(props.items))
const showContract = ref(false)
</script>

<template>
  <section
    class="bg-white"
    :class="hideHeading
      ? ''
      : 'rounded-xl border border-gray-200 px-3.5 py-3 shadow-sm'"
  >
    <template v-if="!hideHeading">
      <p class="text-sm font-semibold text-gray-900">สรุปค่าใช้จ่าย (โดยประมาณ)</p>
      <p class="text-[11px] text-gray-500">ถ้าเริ่มสัญญาวันนี้</p>
    </template>

    <ul class="space-y-1.5 text-sm" :class="hideHeading ? '' : 'mt-2.5'">
      <li
        v-for="line in dueToday.aggregateLines"
        :key="line.id"
        class="flex items-start justify-between gap-3"
      >
        <div class="min-w-0 text-gray-700">
          {{ line.label }}
          <p v-if="line.note" class="mt-0.5 text-[11px] text-gray-500">{{ line.note }}</p>
        </div>
        <span class="shrink-0 font-medium text-gray-900">{{ formatBaht(line.amount) }}</span>
      </li>
    </ul>

    <div class="mt-2.5 flex items-center justify-between gap-3 border-t border-gray-100 pt-2.5">
      <span class="text-sm font-bold text-gray-900">รวมชำระวันนี้</span>
      <span class="text-lg font-bold text-red-700">{{ formatBaht(dueToday.total) }}</span>
    </div>

    <ComboInstallmentHighlight
      v-if="showComboInstallment && comboQuote && comboQuote.per_item.length > 0"
      :quote="comboQuote"
      show-per-item
      class="mt-3"
    />

    <button
      v-if="showContractToggle && totalContract > 0"
      type="button"
      class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
      :aria-expanded="showContract"
      @click="showContract = !showContract"
    >
      <Icon
        name="heroicons:chevron-right"
        class="h-3.5 w-3.5 transition"
        :class="showContract ? 'rotate-90' : ''"
      />
      {{ showContract ? 'ซ่อนภาพรวมตลอดสัญญา' : 'ภาพรวมตลอดสัญญา' }}
    </button>

    <div
      v-if="showContractToggle && showContract"
      class="mt-2 space-y-1 rounded-lg bg-gray-50 px-2.5 py-2 text-sm text-gray-700"
    >
      <div class="flex justify-between gap-2">
        <span>รวมค่างวดทุกบิล</span>
        <span class="font-medium text-gray-900">{{ formatBaht(totalContract) }}</span>
      </div>
      <div
        v-if="comboQuote && comboQuote.savings > 0"
        class="flex justify-between gap-2 text-red-800"
      >
        <span>หลังส่วนลด combo ({{ comboQuote.percent }}%)</span>
        <span class="font-semibold">{{ formatBaht(comboQuote.order_total_charged) }}</span>
      </div>
      <div v-if="totalNet > 0" class="flex justify-between gap-2 border-t border-gray-200/80 pt-1.5">
        <span class="font-medium">ยอดสุทธิโดยประมาณ</span>
        <span class="font-bold text-red-700">{{ formatBaht(comboQuote?.savings ? netAfterCombo : totalNet) }}</span>
      </div>
      <p class="text-[11px] text-gray-500">
        มีมัดจำ = ชำระมัดจำวันรับสินค้า · ไม่มีมัดจำ = ชำระงวดแรกวันเริ่มสัญญา
        · ยอดสุทธิรวมงวดถัดไปตามตารางบิล
        <template v-if="comboQuote?.savings">
          · {{ comboQuote.has_advance_items
            ? 'มีมัดจำ — combo หักตั้งแต่เดือนที่ 1'
            : 'combo มีผลตั้งแต่บิลที่ 2' }}
        </template>
      </p>
    </div>
  </section>
</template>
