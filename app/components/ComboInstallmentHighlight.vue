<script setup lang="ts">
import type { ComboQuoteResult } from '~~/shared/utils/comboPricing'
import { summarizeComboBillTotals } from '~~/shared/utils/comboPricing'
import { comboDeferFromBill1Note } from '~~/shared/utils/comboProgramDisplay'

const props = defineProps<{
  quote: ComboQuoteResult
  /** แสดงรายละเอียดแยกรายการเมื่อมีมากกว่า 1 ชิ้น */
  showPerItem?: boolean
}>()

const pct = computed(() => props.quote.percent)
const bill1 = computed(() => summarizeComboBillTotals(props.quote, 1))
const bill2 = computed(() => summarizeComboBillTotals(props.quote, 2))

const showBill2 = computed(() => props.quote.percent > 0 && bill2.value.has_data)
</script>

<template>
  <div
    v-if="bill1.has_data"
    class="space-y-3"
  >
    <div class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
      <p class="text-xs font-semibold text-gray-900">
        งวดแรกที่ต้องชำระ (บิลที่ 1)
      </p>
      <div class="mt-1.5 flex items-baseline justify-between gap-2">
        <span class="text-sm text-gray-700">รวมค่างวดงวดแรก</span>
        <span class="text-lg font-bold text-gray-900">{{ formatBaht(bill1.total_charged) }}</span>
      </div>
      <p class="mt-0.5 text-[11px] text-gray-500">
        ราคาเต็มตามแผน · ยังไม่หักส่วนลด combo
      </p>
      <ul
        v-if="showPerItem && bill1.lines.length > 1"
        class="mt-2 space-y-1 border-t border-gray-200/80 pt-2"
      >
        <li
          v-for="line in bill1.lines"
          :key="line.product_id"
          class="flex justify-between gap-2 text-[11px] text-gray-700"
        >
          <span class="min-w-0 truncate">{{ line.name }}</span>
          <span class="shrink-0 font-medium">{{ formatBaht(line.charged) }}</span>
        </li>
      </ul>
    </div>

    <div
      v-if="showBill2"
      class="rounded-lg border border-red-200/80 bg-gradient-to-b from-red-50/80 to-white px-3 py-2.5"
    >
      <p class="text-xs font-semibold text-gray-900">
        งวดที่ 2 (หลังรวมส่วนลด combo)
      </p>
      <div class="mt-1.5 flex items-baseline justify-between gap-2">
        <span class="text-sm text-gray-700">รวมชำระงวดที่ 2</span>
        <span class="text-lg font-bold text-red-700">{{ formatBaht(bill2.total_charged) }}</span>
      </div>
      <p class="mt-0.5 text-right text-[11px] text-gray-500">
        ราคาแผนงวดที่ 2 รวม {{ formatBaht(bill2.total_base) }}
      </p>

      <div
        v-if="bill2.savings > 0"
        class="mt-2.5 space-y-1 rounded-md bg-white/90 px-2.5 py-2 text-[11px] text-gray-700"
      >
        <p class="font-medium text-gray-800">
          ส่วนลดในงวดที่ 2 รวม {{ formatBaht(bill2.savings) }}
        </p>
        <div
          v-if="bill2.total_deferred_discount > 0"
          class="flex justify-between gap-2"
        >
          <span>{{ pct }}% ของงวดที่ 1 (เลื่อนมาหักในงวดนี้)</span>
          <span class="shrink-0 font-medium text-red-700">−{{ formatBaht(bill2.total_deferred_discount) }}</span>
        </div>
        <div
          v-if="bill2.total_own_discount > 0"
          class="flex justify-between gap-2"
        >
          <span>{{ pct }}% ของงวดที่ 2</span>
          <span class="shrink-0 font-medium text-red-700">−{{ formatBaht(bill2.total_own_discount) }}</span>
        </div>
      </div>

      <p class="mt-2.5 border-t border-red-100 pt-2 text-[11px] leading-relaxed text-gray-600">
        {{ comboDeferFromBill1Note }}
      </p>

      <ul
        v-if="showPerItem && bill2.lines.length > 1"
        class="mt-2.5 space-y-2 border-t border-red-100/80 pt-2"
      >
        <li
          v-for="line in bill2.lines"
          :key="line.product_id"
          class="text-[11px]"
        >
          <div class="flex justify-between gap-2 font-medium text-gray-800">
            <span class="min-w-0 truncate">{{ line.name }}</span>
            <span class="shrink-0 text-red-700">{{ formatBaht(line.charged) }}</span>
          </div>
          <p
            v-if="(line.deferred_discount ?? 0) > 0"
            class="mt-0.5 flex justify-between text-gray-600"
          >
            <span>เลื่อนจากงวด 1 ({{ pct }}%)</span>
            <span>−{{ formatBaht(line.deferred_discount!) }}</span>
          </p>
          <p
            v-if="(line.own_discount ?? 0) > 0"
            class="flex justify-between text-gray-600"
          >
            <span>งวด 2 ({{ pct }}%)</span>
            <span>−{{ formatBaht(line.own_discount!) }}</span>
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>
