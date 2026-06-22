<script setup lang="ts">
import type { ProductPlanCardOption, ServiceMode } from '~~/shared/types/productPlan'
import {
  availableContractYears,
  availableServiceModes,
  findPlanByYearAndMode,
  pickInitialPlanSelection,
  planShowsServiceInterval,
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

const yearOptions = computed(() => availableContractYears(props.plans))

const modeOptions = computed(() =>
  selectedYears.value != null
    ? availableServiceModes(props.plans, selectedYears.value)
    : [],
)

const selectedPlan = computed(() => {
  if (selectedYears.value == null || selectedMode.value == null) return null
  return findPlanByYearAndMode(props.plans, selectedYears.value, selectedMode.value) ?? null
})

function initSelection() {
  const initial = pickInitialPlanSelection(props.plans, props.defaultPlanId)
  if (!initial) {
    selectedYears.value = null
    selectedMode.value = null
    return
  }
  selectedYears.value = initial.years
  selectedMode.value = initial.mode
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

function modePriceHint(mode: ServiceMode) {
  if (selectedYears.value == null) return null
  const plan = findPlanByYearAndMode(props.plans, selectedYears.value, mode)
  if (!plan?.display_monthly_price) return null
  return formatBaht(plan.display_monthly_price)
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
        รอบบริการทุก {{ selectedPlan.service_interval_months }} เดือน
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
