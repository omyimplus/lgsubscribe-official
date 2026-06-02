<script setup lang="ts">
import type { ComboCustomerSegment } from '~~/shared/types/comboProgram'
import { comboCalculationNote, comboSegmentLabels } from '~~/shared/utils/comboProgramDisplay'
import { isTimelineStepActive } from '~~/shared/utils/comboPricing'

const props = withDefaults(
  defineProps<{
    itemCount: number
    /** docked = ติด panel ล่างตะกร้า — layout กะทัดรัด */
    variant?: 'default' | 'docked'
  }>(),
  { variant: 'default' },
)

const combo = useComboCart()

const segments: ComboCustomerSegment[] = ['new', 'existing']

const isDocked = computed(() => props.variant === 'docked')

const currentPercent = computed(() => combo.quote.value.percent)

const timelineSteps = computed(() => combo.timelineSteps.value)

const timelineRailInset = computed(() => {
  const n = timelineSteps.value.length
  if (n <= 1) return null
  const pct = 100 / (2 * n)
  return { left: `${pct}%`, right: `${pct}%` }
})

function stepCircleClass(step: (typeof timelineSteps.value)[number]) {
  return isTimelineStepActive(step, props.itemCount)
    ? 'combo-timeline__circle-wrap--active'
    : ''
}

function stepIsActive(step: (typeof timelineSteps.value)[number]) {
  return isTimelineStepActive(step, props.itemCount)
}
</script>

<template>
  <section
    class="combo-benefits bg-[#fff9f2]"
    :class="isDocked
      ? 'combo-benefits--docked px-2.5 py-2 sm:px-3 sm:py-2.5'
      : 'rounded-2xl border border-amber-200/80 px-3 py-3 sm:px-4 sm:py-4'"
  >
    <header class="flex items-center justify-between gap-2">
      <p class="text-sm font-bold text-gray-900">
        ส่วนลด Combo
      </p>
      <span
        v-if="currentPercent > 0"
        class="combo-benefits__badge shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
      >
        −{{ currentPercent }}%
      </span>
    </header>

    <!-- docked: ซ่อนคำอธิบายยาวไว้ใน details -->
    <details
      v-if="isDocked"
      class="combo-benefits__details group mt-1"
    >
      <summary
        class="cursor-pointer list-none text-[10px] text-gray-500 marker:content-none hover:text-gray-700 [&::-webkit-details-marker]:hidden"
      >
        <span class="inline-flex items-center gap-0.5">
          วิธีคำนวณส่วนลด
          <Icon
            name="heroicons:chevron-down"
            class="h-3 w-3 transition group-open:rotate-180"
          />
        </span>
      </summary>
      <p class="mt-1 text-[10px] leading-snug text-gray-500">
        {{ comboCalculationNote }}
      </p>
    </details>
    <p
      v-else
      class="mt-1.5 text-[11px] leading-relaxed text-gray-500"
    >
      {{ comboCalculationNote }}
    </p>

    <div
      class="flex rounded-lg border border-gray-200/90 bg-white p-0.5 shadow-sm"
      :class="isDocked ? 'mt-2' : 'mt-3'"
      role="radiogroup"
      aria-label="ประเภทลูกค้า"
    >
      <button
        v-for="seg in segments"
        :key="seg"
        type="button"
        role="radio"
        :aria-checked="combo.segment.value === seg"
        class="flex-1 rounded-md font-semibold transition"
        :class="[
          isDocked ? 'px-2 py-1.5 text-[11px]' : 'rounded-lg px-2 py-2.5 text-xs',
          combo.segment.value === seg
            ? 'bg-[#ea1917] text-white shadow-sm'
            : 'bg-white text-gray-900 hover:bg-gray-50',
        ]"
        @click="combo.setSegment(seg)"
      >
        {{ comboSegmentLabels[seg] }}
      </button>
    </div>

    <div
      v-if="combo.pending.value"
      class="mt-2 text-center text-[11px] text-gray-500"
    >
      กำลังโหลดโปร combo…
    </div>

    <p
      v-else-if="combo.error.value"
      class="mt-2 text-center text-[11px] text-red-600"
    >
      โหลดโปร combo ไม่สำเร็จ
    </p>

    <template v-else-if="combo.hasComboProgram.value">
      <div
        class="combo-benefits__panel"
        :class="isDocked
          ? 'mt-2'
          : 'mt-3 rounded-xl border border-gray-100 bg-white px-3 py-4 shadow-sm'"
      >
        <p
          v-if="!isDocked"
          class="text-center text-xs font-medium text-gray-700"
        >
          {{ comboSegmentLabels[combo.segment.value] }} — ซื้อกี่ชิ้นได้ส่วนลดเท่าไร
        </p>

        <div
          v-if="timelineSteps.length"
          class="combo-timeline-stage relative"
          :class="[
            isDocked ? 'mt-0' : 'mt-4',
            timelineSteps.length > 3 && 'combo-timeline-stage--scroll',
            isDocked && 'combo-timeline-stage--compact',
          ]"
        >
          <div
            v-if="timelineRailInset"
            class="combo-timeline__rail"
            :style="timelineRailInset"
            aria-hidden="true"
          />

          <ol
            class="combo-timeline relative flex w-full"
            aria-label="ชั้นส่วนลดตามจำนวนชิ้น"
          >
            <li
              v-for="step in timelineSteps"
              :key="`${step.min_items}-${step.max_items}`"
              class="combo-timeline__step flex min-w-0 flex-1 flex-col items-center"
            >
              <div class="relative">
                <div
                  class="combo-timeline__circle-wrap relative z-10"
                  :class="stepCircleClass(step)"
                >
                  <span class="combo-timeline__circle-num">{{ step.min_items }}</span>
                </div>
                <span
                  v-if="stepIsActive(step) && props.itemCount > 0 && isDocked"
                  class="combo-timeline__now-badge"
                >
                  ตอนนี้
                </span>
              </div>

              <!-- docked: บรรทัดเดียว ชิ้น + % -->
              <p
                v-if="isDocked"
                class="combo-timeline__caption mt-1.5 max-w-[5.5rem] text-center text-[10px] leading-tight"
              >
                <span
                  :class="stepIsActive(step)
                    ? 'font-semibold text-[#ea1917]'
                    : 'text-gray-500'"
                >{{ step.label }}</span>
                <span class="font-bold text-gray-900"> · ลด {{ step.extra_discount_percent }}%</span>
              </p>
              <template v-else>
                <p
                  class="combo-timeline__label mt-2.5 max-w-[5.5rem] text-center text-[11px] leading-tight"
                  :class="stepIsActive(step)
                    ? 'font-semibold text-[#ea1917]'
                    : 'text-gray-500'"
                >
                  {{ step.label }}
                </p>
                <p class="mt-0.5 text-center text-xs font-bold text-gray-900">
                  ลด {{ step.extra_discount_percent }}%
                </p>
                <p
                  v-if="stepIsActive(step) && props.itemCount > 0"
                  class="combo-timeline__now mt-1.5"
                >
                  ตอนนี้
                </p>
              </template>
            </li>
          </ol>
        </div>
      </div>

      <p
        v-if="props.itemCount > 0 && combo.nextTierHint.value"
        class="combo-benefits__upsell text-amber-950"
        :class="isDocked
          ? 'mt-1.5 rounded-lg border border-dashed border-amber-300/90 bg-white/70 px-2 py-1 text-center text-[10px] leading-snug'
          : 'mt-3 flex items-start gap-2 rounded-xl border border-dashed border-amber-300 bg-white/80 px-3 py-2.5 text-xs leading-snug'"
      >
        <Icon
          v-if="!isDocked"
          name="heroicons:sparkles"
          class="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
          aria-hidden="true"
        />
        <span>
          เพิ่มอีก {{ combo.nextTierHint.value.items_needed }} ชิ้น → ลด
          <strong class="font-bold">{{ combo.nextTierHint.value.percent }}%</strong>
          <span class="text-amber-800/80"> ({{ combo.nextTierHint.value.label }})</span>
        </span>
      </p>

      <p
        v-else-if="props.itemCount === 0 && !isDocked"
        class="mt-3 text-center text-[11px] text-gray-500"
      >
        เลือกสินค้าในตะกร้าเพื่อดูส่วนลดที่ได้รับ
      </p>
    </template>

    <p
      v-else
      class="mt-2 text-center text-[11px] text-gray-500"
    >
      ยังไม่มีโปร combo สำหรับ{{ comboSegmentLabels[combo.segment.value] }}ในช่วงนี้
    </p>
  </section>
</template>

<style scoped>
.combo-benefits__badge {
  background: #ea1917;
  box-shadow: 0 1px 2px rgb(234 25 23 / 0.25);
}

.combo-timeline-stage {
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}

.combo-timeline-stage--compact .combo-timeline__rail {
  top: 1rem;
}

.combo-timeline-stage--compact .combo-timeline__circle-wrap {
  height: 2rem;
  width: 2rem;
}

.combo-timeline-stage--compact .combo-timeline__circle-num {
  font-size: 11px;
}

.combo-timeline-stage--scroll {
  margin-left: -0.25rem;
  margin-right: -0.25rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  -webkit-overflow-scrolling: touch;
}

.combo-timeline-stage--scroll .combo-timeline {
  min-width: 20rem;
}

.combo-timeline-stage--scroll .combo-timeline__step {
  flex: 1 1 5rem;
  min-width: 5rem;
}

.combo-timeline__rail {
  position: absolute;
  z-index: 0;
  top: 1.125rem;
  height: 0;
  border-top: 2px dotted #9ca3af;
}

.combo-timeline__step {
  position: relative;
  z-index: 1;
}

.combo-timeline__circle-wrap {
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 2px solid #d1d5db;
  background: #fff;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.combo-timeline__circle-num {
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: #6b7280;
}

.combo-timeline__circle-wrap--active {
  border-color: #ea1917;
  background: #ea1917;
  box-shadow:
    0 0 0 3px rgb(254 202 202 / 0.8),
    0 1px 2px rgb(234 25 23 / 0.15);
}

.combo-timeline-stage--compact .combo-timeline__circle-wrap--active {
  box-shadow:
    0 0 0 2px rgb(254 202 202 / 0.85),
    0 1px 2px rgb(234 25 23 / 0.12);
}

.combo-timeline__circle-wrap--active .combo-timeline__circle-num {
  color: #fff;
}

.combo-timeline__now-badge {
  position: absolute;
  left: 50%;
  top: -0.375rem;
  z-index: 20;
  transform: translateX(-50%);
  border-radius: 9999px;
  background: #fee2e2;
  padding: 0 0.375rem;
  font-size: 8px;
  font-weight: 700;
  line-height: 1.35;
  color: #ea1917;
  white-space: nowrap;
}

.combo-timeline__now {
  border-radius: 9999px;
  background: #fee2e2;
  padding: 0.125rem 0.625rem;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.25;
  color: #ea1917;
}
</style>
