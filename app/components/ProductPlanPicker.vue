<script setup lang="ts">
import type { ProductPlanCardOption, ServiceMode } from '~~/shared/types/productPlan'
import {
  availableContractYears,
  availableServiceIntervals,
  availableServiceModes,
  pickInitialPlanSelection,
  planShowsServiceInterval,
  planVariantOptionLabel,
  plansForYearAndMode,
  serviceIntervalLabel,
  serviceModeLabels,
  serviceModeShortLabels,
} from '~~/shared/utils/planDisplay'

const props = defineProps<{
  plans: ProductPlanCardOption[]
  defaultPlanId?: string | null
  /** ใช้แสดงในการ์ด “ชำระวันนี้” */
  productName?: string
}>()

const emit = defineEmits<{
  'update:selectedPlan': [plan: ProductPlanCardOption | null]
}>()

const selectedYears = ref<number | null>(null)
const selectedMode = ref<ServiceMode | null>(null)
const selectedIntervalMonths = ref<number | null>(null)
const selectedPlanId = ref<string | null>(null)

const yearOptions = computed(() => availableContractYears(props.plans))

const modeOptions = computed(() =>
  selectedYears.value != null
    ? availableServiceModes(props.plans, selectedYears.value)
    : [],
)

const intervalOptions = computed(() => {
  if (selectedYears.value == null || selectedMode.value == null) return []
  return availableServiceIntervals(props.plans, selectedYears.value, selectedMode.value)
})

const showIntervalStep = computed(() => intervalOptions.value.length > 1)

const candidatePlans = computed(() => {
  if (selectedYears.value == null || selectedMode.value == null) return []
  let matches = plansForYearAndMode(props.plans, selectedYears.value, selectedMode.value)
  if (showIntervalStep.value && selectedIntervalMonths.value != null) {
    matches = matches.filter(p => p.service_interval_months === selectedIntervalMonths.value)
  }
  return matches
})

const showPlanVariantStep = computed(() => !showIntervalStep.value && candidatePlans.value.length > 1)

const selectedPlan = computed(() => {
  if (!selectedPlanId.value) return null
  return props.plans.find(p => p.id === selectedPlanId.value) ?? null
})

function syncIntervalSelection() {
  const intervals = intervalOptions.value
  if (!showIntervalStep.value) {
    selectedIntervalMonths.value = null
    return
  }
  if (selectedIntervalMonths.value && intervals.includes(selectedIntervalMonths.value)) return
  selectedIntervalMonths.value = intervals[0] ?? null
}

function syncPlanSelection() {
  const candidates = candidatePlans.value
  if (!candidates.length) {
    selectedPlanId.value = null
    return
  }
  if (selectedPlanId.value && candidates.some(p => p.id === selectedPlanId.value)) return
  const preferred = props.defaultPlanId
    ? candidates.find(p => p.id === props.defaultPlanId)
    : undefined
  selectedPlanId.value = (preferred ?? candidates.find(p => p.is_default) ?? candidates[0])!.id
}

function initSelection() {
  const initial = pickInitialPlanSelection(props.plans, props.defaultPlanId)
  if (!initial) {
    selectedYears.value = null
    selectedMode.value = null
    selectedIntervalMonths.value = null
    selectedPlanId.value = null
    return
  }
  selectedYears.value = initial.years
  selectedMode.value = initial.mode
  selectedIntervalMonths.value = planShowsServiceInterval(initial.plan)
    ? initial.plan.service_interval_months
    : null
  selectedPlanId.value = initial.plan.id
}

watch(() => [props.plans, props.defaultPlanId] as const, () => initSelection(), { immediate: true, deep: true })

watch(selectedYears, (years) => {
  if (years == null) return
  const modes = availableServiceModes(props.plans, years)
  if (!modes.length) {
    selectedMode.value = null
    return
  }
  if (!selectedMode.value || !modes.includes(selectedMode.value)) {
    selectedMode.value = modes[0]!
  }
})

watch([selectedYears, selectedMode], () => {
  syncIntervalSelection()
  syncPlanSelection()
})

watch([selectedIntervalMonths, candidatePlans], () => syncPlanSelection())

watch(selectedPlan, plan => emit('update:selectedPlan', plan), { immediate: true })

const dueTodayItem = computed(() => {
  const plan = selectedPlan.value
  if (!plan) return null
  return {
    product_id: plan.id,
    name: props.productName?.trim() || 'สินค้านี้',
    advance_amount: plan.advance_amount,
    advance_note: plan.advance_note,
    display_monthly_price: plan.display_monthly_price ?? 0,
    display_price_note: plan.display_price_note,
  }
})

function selectYears(years: number) {
  selectedYears.value = years
}

function selectMode(mode: ServiceMode) {
  selectedMode.value = mode
}

function selectInterval(months: number) {
  selectedIntervalMonths.value = months
}

function modePriceHint(mode: ServiceMode) {
  if (selectedYears.value == null) return null
  const variants = plansForYearAndMode(props.plans, selectedYears.value, mode)
  const prices = variants
    .map(p => p.display_monthly_price)
    .filter((n): n is number => n != null)
  if (!prices.length) return null
  const min = Math.min(...prices)
  if (prices.length > 1 && new Set(prices).size > 1) return `${formatBaht(min)}+`
  return formatBaht(min)
}

function intervalPriceHint(months: number) {
  if (selectedYears.value == null || selectedMode.value == null) return null
  const plan = plansForYearAndMode(props.plans, selectedYears.value, selectedMode.value)
    .find(p => p.service_interval_months === months)
  if (!plan?.display_monthly_price) return null
  return formatBaht(plan.display_monthly_price)
}

function selectPlan(planId: string) {
  selectedPlanId.value = planId
}
</script>

<template>
  <div v-if="plans.length" class="space-y-3">
    <!-- ขั้นที่ 1: ระยะสัญญา (ปี) -->
    <div>
      <p class="mb-1.5 text-xs font-medium text-gray-700">ระยะสัญญา</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="years in yearOptions"
          :key="years"
          type="button"
          class="min-w-[3.25rem] rounded-full border px-3 py-1.5 text-xs font-semibold transition"
          :class="selectedYears === years
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'"
          @click="selectYears(years)"
        >
          {{ years }} ปี
        </button>
      </div>
    </div>

    <!-- ขั้นที่ 2: ประเภทบริการ -->
    <div v-if="selectedYears != null && modeOptions.length">
      <p class="mb-1.5 text-xs font-medium text-gray-700">ประเภทบริการ</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="mode in modeOptions"
          :key="mode"
          type="button"
          class="flex flex-col items-start rounded-xl border px-2.5 py-2 text-left transition sm:min-w-[5.5rem]"
          :class="selectedMode === mode
            ? 'border-red-500 bg-red-50 ring-1 ring-red-500'
            : 'border-gray-200 bg-white hover:border-gray-300'"
          :title="serviceModeLabels[mode]"
          @click="selectMode(mode)"
        >
          <span class="text-xs font-semibold text-gray-900">{{ serviceModeShortLabels[mode] }}</span>
          <span
            v-if="modePriceHint(mode)"
            class="mt-0.5 text-[11px] font-medium"
            :class="selectedMode === mode ? 'text-red-600' : 'text-gray-500'"
          >
            {{ modePriceHint(mode) }}/ด.
          </span>
        </button>
      </div>
    </div>

    <!-- ขั้นที่ 3: รอบบริการ (Visit/Self ที่ปี+โหมดเดียวกัน แต่รอบต่างกัน เช่น 6 vs 12 เดือน) -->
    <div v-if="showIntervalStep">
      <p class="mb-1.5 text-xs font-medium text-gray-700">รอบบริการ</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="months in intervalOptions"
          :key="months"
          type="button"
          class="flex flex-col items-start rounded-xl border px-2.5 py-2 text-left transition sm:min-w-[5.5rem]"
          :class="selectedIntervalMonths === months
            ? 'border-red-500 bg-red-50 ring-1 ring-red-500'
            : 'border-gray-200 bg-white hover:border-gray-300'"
          @click="selectInterval(months)"
        >
          <span class="text-xs font-semibold text-gray-900">{{ serviceIntervalLabel(months) }}</span>
          <span
            v-if="intervalPriceHint(months)"
            class="mt-0.5 text-[11px] font-medium"
            :class="selectedIntervalMonths === months ? 'text-red-600' : 'text-gray-500'"
          >
            {{ intervalPriceHint(months) }}/ด.
          </span>
        </button>
      </div>
    </div>

    <!-- ขั้นที่ 3 (สำรอง): แผนสัญญา — เมื่อไม่มีรอบบริการแยกได้ (เช่น No service สองโปร) -->
    <div v-else-if="showPlanVariantStep">
      <p class="mb-1.5 text-xs font-medium text-gray-700">แผนสัญญา</p>
      <div class="flex flex-col gap-1.5">
        <button
          v-for="plan in candidatePlans"
          :key="plan.id"
          type="button"
          class="rounded-xl border px-3 py-2 text-left transition"
          :class="selectedPlanId === plan.id
            ? 'border-red-500 bg-red-50 ring-1 ring-red-500'
            : 'border-gray-200 bg-white hover:border-gray-300'"
          @click="selectPlan(plan.id)"
        >
          <span class="text-xs font-semibold text-gray-900">{{ planVariantOptionLabel(plan) }}</span>
          <span
            v-if="plan.display_monthly_price != null"
            class="mt-0.5 block text-[11px] font-medium"
            :class="selectedPlanId === plan.id ? 'text-red-600' : 'text-gray-500'"
          >
            {{ formatBaht(plan.display_monthly_price) }}/ด.
          </span>
        </button>
      </div>
    </div>

    <!-- ราคาที่เลือก -->
    <div
      v-if="selectedPlan"
      class="rounded-xl border border-red-100 bg-gradient-to-b from-red-50/80 to-white px-3 py-3"
    >
      <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500">ราคาที่เลือก</p>
      <div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0">
        <span class="text-2xl font-bold leading-none text-red-600">
          {{ formatBaht(selectedPlan.display_monthly_price ?? 0) }}
        </span>
        <span class="text-sm font-medium text-gray-600">/ เดือน</span>
      </div>
      <p v-if="selectedPlan.display_price_note" class="mt-1 text-xs text-gray-600">
        {{ selectedPlan.display_price_note }}
      </p>
      <p v-if="selectedPlan && planShowsServiceInterval(selectedPlan)" class="mt-0.5 text-[11px] text-gray-500">
        รอบบริการ{{ serviceIntervalLabel(selectedPlan.service_interval_months!) }}
      </p>

      <InterestCostSummary
        v-if="dueTodayItem"
        :items="[dueTodayItem]"
        :total-contract="selectedPlan.computed_total ?? 0"
        :total-net="selectedPlan.computed_net_total ?? 0"
        class="mt-2.5"
      />
    </div>
  </div>
</template>
