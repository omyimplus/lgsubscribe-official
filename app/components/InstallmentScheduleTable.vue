<script setup lang="ts">
import type { InstallmentSchedule } from '~~/shared/utils/installmentSchedule'
import { formatMoneyAmount } from '~~/shared/utils/moneyFormat'

const props = defineProps<{
  schedule: InstallmentSchedule
  /** cart = หลายสินค้าในตะกร้า + combo, product = เปรียบเทียบแผนสัญญา */
  variant: 'cart' | 'product'
}>()

function formatPrice(n: number) {
  return formatMoneyAmount(n, '0')
}

function formatNormalBaht(base: number) {
  return `ปกติ ${formatPrice(base)} บาท`
}

const showTotalColumn = computed(() => props.variant === 'cart')

const cartComboActive = computed(
  () => props.variant === 'cart' && props.schedule.combo_percent > 0,
)

/** งวดบิลแผน 1 ที่ยังไม่หัก combo — เฉพาะรายการไม่มีมัดจำ */
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
}

function comboSavingsAmount(
  cell: {
    source_bill: number | null
    in_contract: boolean
    base: number
    charged: number
    combo_applied: boolean
    is_advance: boolean
    is_signup_payment: boolean
    prepaid_at_signup: boolean
    percent: number
    deferred_discount: number
    own_discount: number
  },
  colHasAdvance: boolean,
) {
  if (cell.is_advance || cell.is_signup_payment || cell.prepaid_at_signup) return 0
  if (showBill1FullPriceNote(cell, colHasAdvance)) return 0
  if (!cell.combo_applied || cell.percent <= 0) return 0
  return Math.max(0, cell.base - cell.charged)
}

/** ไม่มีมัดจำ เดือนที่ 2 — เลื่อนส่วนลด combo งวดแรกมาหักในงวดนี้ */
function showDeferBill1ComboNote(
  cell: {
    source_bill: number | null
    combo_applied: boolean
    is_advance: boolean
    is_signup_payment: boolean
    prepaid_at_signup: boolean
    deferred_discount: number
    percent: number
  },
  colHasAdvance: boolean,
) {
  return !colHasAdvance
    && !cell.is_advance
    && !cell.is_signup_payment
    && !cell.prepaid_at_signup
    && cell.source_bill === 2
    && cell.combo_applied
    && cell.percent > 0
    && cell.deferred_discount > 0
}

const productScheduleDisclaimers = [
  'ราคาส่วนลดพิเศษใดๆ จะมีผลเฉพาะออเดอร์ที่ทำรายการสำเร็จและได้รับอนุมัติ ภายในวันเวลาที่กำหนดเท่านั้น',
  'ราคาข้างต้นเป็นเพียงราคาที่อาจจะมีการปรับตามราคาจริงตามระบบ ตอนสั่งซื้อ เนื่องจากการปัดเศษทศนิยมของแต่ละรายการสินค้า',
  'บริษัทฯขอสงวนสิทธิ์ในการเปลี่ยนแปลงโปรโมชั่น โดยมิต้องแจ้งให้ทราบล่วงหน้า',
  'เงื่อนไขเป็นไปตามที่บริษัทฯกำหนด',
] as const

const footnote = computed(() => {
  if (props.variant !== 'cart') return null
  if (props.schedule.has_advance_shift) {
    return 'วันทำรายการ = มัดจำ · เดือนที่ 1 = บิลแผน 1 (หัก combo ทันที) · เดือนที่ 2 ขึ้นไปหัก % เฉพาะงวดนั้น · ยอดรวมต่อแถว = ผลรวมทุกรายการ'
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
              class="schedule-table__product-col px-1.5 py-2.5 text-center align-top sm:px-2 sm:py-3"
            >
              <template v-if="variant === 'cart'">
                <div class="schedule-table__product-head flex flex-col items-center">
                  <div class="schedule-table__product-thumb mb-1.5 sm:mb-2">
                    <img
                      v-if="col.image_url"
                      :src="col.image_url"
                      :alt="col.name"
                      class="schedule-table__product-thumb-img"
                    >
                    <div
                      v-else
                      class="schedule-table__product-thumb-placeholder"
                    >
                      <Icon
                        name="heroicons:photo"
                        class="h-6 w-6 text-white/50"
                      />
                    </div>
                  </div>
                  <p
                    class="schedule-table__product-name w-full text-[10px] font-medium leading-tight sm:text-xs"
                    :title="col.name"
                  >
                    {{ col.name }}
                  </p>
                  <p
                    v-if="col.quantity > 1"
                    class="mt-0.5 text-[10px] font-semibold text-amber-200 sm:text-xs"
                  >
                    ×{{ col.quantity }} ชิ้น
                  </p>
                  <p class="mt-0.5 w-full truncate font-mono text-[9px] text-white/80 sm:text-[10px]" :title="col.sku">
                    {{ col.sku }}
                  </p>
                </div>
              </template>
              <template v-else>
                <p
                  class="schedule-table__product-name text-xs font-bold leading-tight sm:text-sm"
                  :title="col.name"
                >
                  {{ col.name }}
                </p>
                <p
                  class="schedule-table__product-name mt-1 text-[10px] font-normal text-white/85 sm:text-xs"
                  :title="col.contract_condition"
                >
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
              class="schedule-table__product-col px-1.5 py-1.5 text-center text-[9px] text-white/90 sm:px-2 sm:py-2 sm:text-xs"
            >
              <p
                class="schedule-table__product-name"
                :title="col.contract_condition"
              >
                {{ col.contract_condition }}
              </p>
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
              class="schedule-table__product-col px-1.5 py-2.5 text-center align-top sm:px-2 sm:py-3"
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
                <template v-else-if="showDeferBill1ComboNote(cell, schedule.columns[colIndex]!.has_advance)">
                  <p class="text-[10px] text-gray-500 sm:text-xs">
                    {{ formatNormalBaht(cell.base) }}
                  </p>
                  <p class="text-[10px] font-medium text-[#ea1917] sm:text-xs">
                    รวม combo งวดแรก
                  </p>
                  <p class="text-[10px] font-medium text-[#ea1917] sm:text-xs">
                    ส่วนลด combo −{{ formatPrice(comboSavingsAmount(cell, schedule.columns[colIndex]!.has_advance)) }} บาท
                  </p>
                  <p class="mt-0.5 text-sm font-bold text-[#ea1917] sm:text-lg">
                    {{ formatPrice(cell.charged) }}
                  </p>
                </template>
                <template v-else-if="showSimpleComboDiscount(cell, schedule.columns[colIndex]!.has_advance) || cell.base > 0">
                  <p class="text-[10px] text-gray-500 sm:text-xs">
                    {{ formatNormalBaht(cell.base) }}
                  </p>
                  <p
                    v-if="comboSavingsAmount(cell, schedule.columns[colIndex]!.has_advance) > 0"
                    class="text-[10px] font-medium text-[#ea1917] sm:text-xs"
                  >
                    ส่วนลด combo −{{ formatPrice(comboSavingsAmount(cell, schedule.columns[colIndex]!.has_advance)) }} บาท
                  </p>
                </template>
                <p
                  v-if="!cell.is_advance && !cell.is_signup_payment && !cell.prepaid_at_signup && !showDeferBill1ComboNote(cell, schedule.columns[colIndex]!.has_advance)"
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

    <div
      v-if="variant === 'product'"
      class="mx-3 mb-3 px-1 text-left text-[10px] leading-relaxed text-gray-600 sm:mx-5 sm:mb-4 sm:text-xs"
    >
      <p class="mb-1.5 font-semibold text-gray-800">หมายเหตุ</p>
      <ol class="list-decimal space-y-1 pl-4">
        <li v-for="(line, index) in productScheduleDisclaimers" :key="index">
          {{ line }}
        </li>
      </ol>
    </div>

    <p
      v-else-if="footnote"
      class="mx-3 mb-3 px-1 text-left text-[10px] leading-relaxed text-gray-500 sm:mx-5 sm:mb-4 sm:text-center sm:text-xs"
    >
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

.schedule-table__product-col {
  width: 9rem;
  min-width: 9rem;
  max-width: 9rem;
}

@media (min-width: 640px) {
  .schedule-table__product-col {
    width: 11.5rem;
    min-width: 11.5rem;
    max-width: 11.5rem;
  }
}

.schedule-table__product-head {
  align-items: center;
}

.schedule-table__product-thumb {
  display: flex;
  width: 100%;
  justify-content: center;
  line-height: 0;
}

.schedule-table__product-thumb-img {
  display: block;
  max-width: 100%;
  max-height: 2.75rem;
  width: auto;
  height: auto;
  border-radius: 0.375rem;
  background: rgb(255 255 255 / 0.95);
  object-fit: contain;
  object-position: top center;
}

.schedule-table__product-thumb-placeholder {
  display: flex;
  height: 2.75rem;
  width: 2.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: rgb(255 255 255 / 0.1);
}

@media (min-width: 640px) {
  .schedule-table__product-thumb-img {
    max-height: 4rem;
  }

  .schedule-table__product-thumb-placeholder {
    height: 4rem;
    width: 4rem;
  }
}

.schedule-table__head th.schedule-table__product-col {
  vertical-align: top;
}

.schedule-table__product-name {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  overflow-wrap: anywhere;
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
