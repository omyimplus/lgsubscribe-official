<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import type { ProductPlan, ProductPlansResponse } from '~~/shared/types/productPlan'
import { planContractTitle, serviceModeLabels } from '~~/shared/utils/planDisplay'
import { totalContractAmount, totalNetAmount } from '~~/shared/utils/planPricing'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  'update:selectedPlan': [plan: ProductPlan | null]
}>()

const { data: plansData, pending, error } = await useFetch<ProductPlansResponse>(
  () => `/api/products/${props.product.id}/plans`,
  { key: `product-plans-${props.product.id}` },
)

const selectedPlanId = ref<string | null>(null)

const activePlans = computed(() => plansData.value?.plans ?? [])

const selectedPlan = computed(() =>
  activePlans.value.find(p => p.id === selectedPlanId.value) ?? null,
)

watch(activePlans, (plans) => {
  if (!plans.length) {
    selectedPlanId.value = null
    return
  }
  const defaultId = plansData.value?.default_plan_id
  const pick = (defaultId && plans.some(p => p.id === defaultId))
    ? defaultId
    : (plans.find(p => p.is_default)?.id ?? plans[0]!.id)
  selectedPlanId.value = pick
}, { immediate: true })

watch(selectedPlan, plan => emit('update:selectedPlan', plan), { immediate: true })

const computedTotal = computed(() => {
  const tiers = selectedPlan.value?.billing_tiers ?? []
  return tiers.length ? totalContractAmount(tiers) : null
})

const computedNetTotal = computed(() => {
  if (computedTotal.value == null) return null
  return totalNetAmount(computedTotal.value, selectedPlan.value?.advance_amount)
})

function formatPromoPeriod(plan: ProductPlan) {
  if (!plan.promo_period_start && !plan.promo_period_end) return null
  return [plan.promo_period_start, plan.promo_period_end].filter(Boolean).join(' – ')
}
</script>

<template>
  <section class="rounded-2xl border border-gray-200 bg-white p-5">
    <h2 class="text-lg font-semibold text-gray-900">แผนสัญญาและราคา</h2>

    <div v-if="pending" class="mt-4 text-sm text-gray-400">กำลังโหลดแผนสัญญา...</div>
    <div v-else-if="error" class="mt-4 text-sm text-red-600">โหลดแผนสัญญาไม่สำเร็จ</div>

    <div v-else-if="!activePlans.length" class="mt-4 rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
      ยังไม่มีแผนสัญญาสำหรับสินค้านี้ — กรุณาติดต่อเพื่อสอบถามราคา
    </div>

    <template v-else>
      <p v-if="activePlans.length > 1" class="mt-2 text-xs text-gray-500">
        เลือกรายการสัญญาที่ต้องการ (ราคาและเงื่อนไขต่างกัน)
      </p>

      <div class="mt-4 flex flex-col gap-2">
        <label
          v-for="plan in activePlans"
          :key="plan.id"
          class="flex cursor-pointer gap-3 rounded-xl border p-3 transition"
          :class="selectedPlanId === plan.id
            ? 'border-red-500 bg-red-50/50'
            : 'border-gray-200 hover:border-gray-300'"
        >
          <input
            v-model="selectedPlanId"
            type="radio"
            class="mt-1 text-red-600"
            :value="plan.id"
          >
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-900">{{ planContractTitle(plan) }}</p>
            <p v-if="plan.service_interval_months" class="text-xs text-gray-500">
              รอบบริการทุก {{ plan.service_interval_months }} เดือน
            </p>
            <p v-if="plan.policy_code" class="mt-0.5 font-mono text-xs text-gray-500">
              {{ plan.policy_code }}
            </p>
            <p class="mt-1 text-lg font-bold text-red-600">
              {{ formatBaht(plan.display_monthly_price ?? 0) }}
              <span class="text-sm font-normal text-gray-600">/เดือน</span>
            </p>
            <p v-if="plan.display_monthly_price != null && plan.billing_tiers?.length" class="text-xs text-gray-600">
              {{ plan.billing_tiers[0]?.note || `บิล ${plan.billing_tiers[0]?.bill_from}–${plan.billing_tiers[0]?.bill_to}` }}
            </p>
          </div>
        </label>
      </div>

      <div v-if="selectedPlan" class="mt-6 space-y-4">
        <div v-if="formatPromoPeriod(selectedPlan)" class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          โปรโมชัน: {{ formatPromoPeriod(selectedPlan) }}
        </div>

        <div>
          <h3 class="text-sm font-semibold text-gray-800">ช่วงบิลรายเดือน</h3>
          <div class="mt-2 overflow-x-auto rounded-xl border border-gray-100">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th class="px-3 py-2">บิล</th>
                  <th class="px-3 py-2">ราคา/เดือน</th>
                  <th class="px-3 py-2">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="tier in selectedPlan.billing_tiers"
                  :key="`${tier.bill_from}-${tier.bill_to}`"
                  class="border-t border-gray-50"
                >
                  <td class="px-3 py-2 text-gray-700">{{ tier.bill_from }} – {{ tier.bill_to }}</td>
                  <td class="px-3 py-2 font-medium text-gray-900">{{ formatBaht(tier.monthly_price) }}</td>
                  <td class="px-3 py-2 text-gray-600">{{ tier.note || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-xl bg-red-50 px-4 py-3 text-sm">
          <div v-if="selectedPlan.list_price != null" class="text-gray-600">
            ราคาปกติ (อ้างอิง PDF): <span class="font-medium text-gray-800">{{ formatBaht(selectedPlan.list_price) }}</span>
          </div>
          <div class="mt-1">
            <span class="text-gray-600">รวมค่างวดตลอดสัญญา: </span>
            <span class="font-bold text-red-600">{{ formatBaht(computedTotal ?? selectedPlan.computed_total ?? 0) }}</span>
          </div>
          <div v-if="selectedPlan.advance_amount" class="mt-1">
            <span class="text-gray-600">มัดจำล่วงหน้า: </span>
            <span class="font-medium text-gray-800">{{ formatBaht(selectedPlan.advance_amount) }}</span>
            <span v-if="selectedPlan.advance_note" class="ml-1 text-xs text-gray-500">{{ selectedPlan.advance_note }}</span>
          </div>
          <div class="mt-1">
            <span class="text-gray-600">ยอดสุทธิโดยประมาณ: </span>
            <span class="text-lg font-bold text-red-700">{{ formatBaht(computedNetTotal ?? selectedPlan.computed_net_total ?? 0) }}</span>
          </div>
        </div>

        <p class="text-xs text-gray-500">
          ประเภทบริการ: {{ serviceModeLabels[selectedPlan.service_mode] }} · {{ selectedPlan.contract_months }} บิล
        </p>
      </div>
    </template>
  </section>
</template>
