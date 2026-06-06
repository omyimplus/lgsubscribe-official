<script setup lang="ts">
import type { InstallmentSchedule } from '~~/shared/utils/installmentSchedule'

const props = defineProps<{
  schedule: InstallmentSchedule
  /** cart = หลายสินค้าในตะกร้า + combo, product = เปรียบเทียบแผนสัญญา */
  variant: 'cart' | 'product'
}>()

function formatPrice(n: number) {
  return Math.round(n).toLocaleString('th-TH')
}

function formatNormalBaht(base: number) {
  return `ปกติ ${formatPrice(base)} บาท`
}

const showTotalColumn = computed(() => props.variant === 'cart')

const cartComboActive = computed(
  () => props.variant === 'cart' && props.schedule.combo_percent > 0,
)

/** งวดบิลแผน 1 ที่ยังไม่หัก combo — ไม่ใช้เมื่อแสดง — วันทำรายการแล้ว */
function showBill1FullPriceNote(
  cell: {
    source_bill: number | null
    in_contract: boolean
    is_advance: boolean
    prepaid_at_signup: boolean
  },
  colHasAdvance: boolean,
) {
  return cartComboActive.value
    && cell.in_contract
    && !cell.is_advance
    && !cell.prepaid_at_signup
    && cell.source_bill === 1
    && !colHasAdvance
}

function showBill2ComboBreakdown(cell: {
  source_bill: number | null
  combo_applied: boolean
  is_advance: boolean
  deferred_discount: number
  own_discount: number
}) {
  return cell.combo_applied
    && !cell.is_advance
    && cell.source_bill === 2
    && (cell.deferred_discount > 0 || cell.own_discount > 0)
}

function showSimpleComboDiscount(
  cell: {
    source_bill: number | null
    combo_applied: boolean
    is_advance: boolean
    percent: number
  },
  colHasAdvance: boolean,
) {
  return cell.combo_applied
    && cell.percent > 0
    && !cell.is_advance
    && !showBill1FullPriceNote(cell, colHasAdvance)
    && !showBill2ComboBreakdown(cell)
}

const footnote = computed(() => {
  if (props.variant !== 'cart') {
    return 'แต่ละคอลัมน์ = แผนสัญญาหนึ่งแบบ · วันทำรายการ = มัดจำ (ถ้ามี) หรืองวด 1 (ถ้าไม่มีมัดจำ) · เดือนที่ 1 = — ถ้างวด 1 ชำระแล้ววันทำรายการ'
  }
  if (props.schedule.has_advance_shift) {
    return 'วันทำรายการ = มัดจำ · เดือนที่ 1 = บิลแผน 1 · เดือนที่ 2 = บิลแผน 2 · combo ตามสูตรบิลแผน (เดือนที่ 2 หัก % บิล 1 + งวดนี้) · ยอดรวมต่อแถว = ผลรวมทุกรายการ'
  }
  return 'วันทำรายการ = งวดที่ 1 · เดือนที่ 1 = ไม่ต้องชำระ (—) · เดือนที่ 2 หัก % ของงวด 1 (เลื่อน) + % ของงวด 2 · เดือนที่ 3 เป็นต้นไป หัก % ของงวดนั้น · ยอดรวมต่อแถว = ผลรวมทุกรายการในตะกร้า'
})
</script>

<template>
  <div>
    <div
      v-if="schedule.promo_headline && variant === 'cart'"
      class="schedule-promo mx-2 mt-3 rounded-lg px-3 py-2 text-center text-[11px] font-semibold leading-snug text-white sm:mx-5 sm:mt-4 sm:px-4 sm:py-2.5 sm:text-sm"
    >
      {{ schedule.promo_headline }}
    </div>

    <p
      v-if="variant === 'cart' && schedule.columns.length > 1"
      class="schedule-scroll-hint mx-3 mb-2 flex items-center justify-center gap-1.5 rounded-md bg-gray-100 px-2 py-1.5 text-center text-[10px] text-gray-600 sm:mx-5 md:hidden"
    >
      <Icon name="heroicons:arrows-right-left" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      เลื่อนซ้าย–ขวาดูทุกรายการ
    </p>

    <div class="schedule-table-wrap mx-2 my-3 sm:mx-5 sm:my-4">
      <table class="schedule-table w-max min-w-full border-collapse text-[11px] sm:text-sm">
        <thead>
          <tr class="schedule-table__head">
            <th class="schedule-table__corner schedule-table__sticky-col sticky left-0 z-20 min-w-[4.75rem] px-2 py-2.5 text-left text-[11px] font-semibold sm:min-w-[7rem] sm:px-3 sm:py-3 sm:text-sm">
              เดือนที่
            </th>
            <th
              v-for="col in schedule.columns"
              :key="col.column_key"
              class="min-w-[7.25rem] px-1.5 py-2.5 text-center align-bottom sm:min-w-[9.5rem] sm:px-2 sm:py-3"
            >
              <template v-if="variant === 'cart'">
                <div class="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-white/10 sm:mb-2 sm:h-14 sm:w-14">
                  <img
                    v-if="col.image_url"
                    :src="col.image_url"
                    :alt="col.name"
                    class="h-full w-full object-contain"
                  >
                  <Icon
                    v-else
                    name="heroicons:photo"
                    class="h-6 w-6 text-white/50"
                  />
                </div>
                <p class="line-clamp-2 text-[10px] font-medium leading-tight sm:text-xs">
                  {{ col.name }}
                </p>
                <p
                  v-if="col.quantity > 1"
                  class="mt-0.5 text-[10px] font-semibold text-amber-200 sm:text-xs"
                >
                  ×{{ col.quantity }} ชิ้น
                </p>
                <p class="mt-0.5 font-mono text-[9px] text-white/80 sm:text-[10px]">
                  {{ col.sku }}
                </p>
              </template>
              <template v-else>
                <p class="text-xs font-bold leading-tight sm:text-sm">
                  {{ col.name }}
                </p>
                <p class="mt-1 text-[10px] font-normal text-white/85 sm:text-xs">
                  {{ col.contract_condition }}
                </p>
                <p
                  v-if="col.advance_amount"
                  class="mt-1.5 text-[9px] font-medium text-amber-200 sm:text-[10px]"
                >
                  มัดจำ {{ formatPrice(col.advance_amount) }} บ.
                </p>
              </template>
            </th>
            <th
              v-if="showTotalColumn"
              class="schedule-table__total min-w-[4.25rem] px-2 py-2.5 text-center align-bottom text-[11px] font-semibold sm:min-w-[5.5rem] sm:px-3 sm:py-3 sm:text-sm"
            >
              รวม
            </th>
          </tr>
          <tr
            v-if="variant === 'cart'"
            class="schedule-table__subhead"
          >
            <td class="schedule-table__sticky-col sticky left-0 z-20 bg-[#243b5c] px-2 py-1.5 text-[10px] font-medium text-white/90 sm:px-3 sm:py-2 sm:text-xs">
              เงื่อนไขสัญญา
            </td>
            <td
              v-for="col in schedule.columns"
              :key="`cond-${col.column_key}`"
              class="px-1.5 py-1.5 text-center text-[9px] text-white/90 sm:px-2 sm:py-2 sm:text-xs"
            >
              <p>{{ col.contract_condition }}</p>
              <p
                v-if="col.has_advance && col.advance_amount"
                class="mt-1 font-medium text-amber-200"
              >
                มัดจำ {{ formatPrice(col.advance_amount) }} บ. (วันทำรายการ)
              </p>
            </td>
            <td class="schedule-table__total px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in schedule.rows"
            :key="`${row.bill_from}-${row.bill_to}`"
            class="border-b border-gray-200 bg-white"
          >
            <th
              scope="row"
              class="schedule-table__sticky-col schedule-table__row-label sticky left-0 z-10 border-r border-gray-100 bg-gray-50 px-2 py-2.5 text-left text-[11px] font-semibold text-gray-800 sm:px-3 sm:py-3 sm:text-sm"
            >
              {{ row.label }}
            </th>
            <td
              v-for="(cell, colIndex) in row.cells"
              :key="schedule.columns[colIndex]!.column_key"
              class="px-1.5 py-2.5 text-center align-top sm:px-2 sm:py-3"
            >
              <template v-if="!cell.in_contract">
                <span class="text-gray-300">—</span>
              </template>
              <template v-else>
                <template v-if="cell.is_advance">
                  <p class="text-[10px] text-gray-500 sm:text-xs">
                    มัดจำ
                  </p>
                  <p class="mt-0.5 text-sm font-bold text-[#ea1917] sm:text-lg">
                    {{ formatPrice(cell.charged) }}
                  </p>
                  <p class="mt-0.5 text-[10px] font-medium text-[#ea1917] sm:mt-1">
                    ชำระวันทำรายการ
                  </p>
                </template>
                <template v-else-if="cell.is_signup_payment">
                  <p class="text-[10px] text-gray-500 sm:text-xs">
                    งวดที่ 1
                  </p>
                  <p class="mt-0.5 text-sm font-bold text-[#ea1917] sm:text-lg">
                    {{ formatPrice(cell.charged) }}
                  </p>
                  <p class="mt-0.5 text-[10px] font-medium text-[#ea1917] sm:mt-1">
                    ชำระวันทำรายการ
                  </p>
                </template>
                <template v-else-if="cell.prepaid_at_signup">
                  <span class="text-gray-300">—</span>
                </template>
                <template v-else-if="showBill1FullPriceNote(cell, schedule.columns[colIndex]!.has_advance)">
                  <p class="text-[10px] text-gray-500 sm:text-xs">
                    {{ formatNormalBaht(cell.base) }}
                  </p>
                  <p class="text-[10px] text-gray-400 sm:text-xs">
                    ยังไม่หัก combo
                  </p>
                </template>
                <template v-else-if="showBill2ComboBreakdown(cell)">
                  <p class="text-[10px] text-gray-500 sm:text-xs">
                    {{ formatNormalBaht(cell.base) }}
                  </p>
                  <p class="text-[10px] text-gray-500 sm:text-xs">
                    รวม combo งวดแรก
                  </p>
                </template>
                <p
                  v-else-if="showSimpleComboDiscount(cell, schedule.columns[colIndex]!.has_advance) || cell.base > 0"
                  class="text-[10px] text-gray-500 sm:text-xs"
                >
                  {{ formatNormalBaht(cell.base) }}
                </p>
                <p
                  v-if="!cell.is_advance && !cell.is_signup_payment && !cell.prepaid_at_signup"
                  class="mt-0.5 text-sm font-bold text-[#ea1917] sm:text-lg"
                >
                  {{ formatPrice(cell.charged) }}
                </p>
              </template>
            </td>
            <td
              v-if="showTotalColumn"
              class="schedule-table__total-cell px-2 py-2.5 text-center align-top sm:px-3 sm:py-3"
            >
              <p class="text-sm font-bold text-gray-900 sm:text-lg">
                {{ formatPrice(row.total_charged) }}
              </p>
              <p class="text-[10px] text-gray-500">
                บาท
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mx-3 mb-3 px-1 text-left text-[10px] leading-relaxed text-gray-500 sm:mx-5 sm:mb-4 sm:text-center sm:text-xs">
      {{ footnote }}
    </p>
  </div>
</template>

<style scoped>
.schedule-promo {
  background: linear-gradient(135deg, #c41e1a 0%, #ea1917 50%, #b91c1c 100%);
}

.schedule-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #fff;
  scrollbar-width: thin;
}

.schedule-table__sticky-col {
  box-shadow: 4px 0 10px -4px rgb(0 0 0 / 0.12);
}

.schedule-table__row-label {
  white-space: nowrap;
}

.schedule-table__head {
  background: #1e3354;
  color: #fff;
}

.schedule-table__head th {
  vertical-align: bottom;
}

.schedule-table__corner {
  background: #1e3354;
}

.schedule-table__subhead td {
  background: #243b5c;
  border-top: 1px solid rgb(255 255 255 / 0.12);
}

.schedule-table__total {
  background: #1e3354;
  color: #fff;
}

.schedule-table__total-cell {
  background: #f9fafb;
  border-left: 2px solid #e5e7eb;
  font-weight: 600;
}
</style>
