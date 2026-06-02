<script setup lang="ts">
import type { InquiryItem } from '~~/shared/types/inquiry'
import { serviceModeLabels } from '~~/shared/utils/planDisplay'

const props = defineProps<{
  item: InquiryItem
}>()

const serviceLabel = computed(() => serviceModeLabels[props.item.service_mode])
</script>

<template>
  <div class="space-y-4">
    <div class="flex gap-3">
      <div
        v-if="item.image_url"
        class="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-gray-50"
      >
        <img :src="item.image_url" :alt="item.name" class="h-full w-full object-contain">
      </div>
      <div class="min-w-0 flex-1">
        <p class="font-medium text-gray-900">{{ item.name }}</p>
        <p class="mt-0.5 font-mono text-xs text-gray-500">{{ item.sku }}</p>
      </div>
    </div>

    <div class="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm">
      <dl class="space-y-2">
        <div class="flex justify-between gap-2">
          <dt class="text-gray-600">สัญญา</dt>
          <dd class="font-medium text-gray-900">{{ item.contract_label }}</dd>
        </div>
        <div class="flex justify-between gap-2">
          <dt class="text-gray-600">ระยะเวลา</dt>
          <dd class="text-gray-900">{{ item.contract_years }} ปี ({{ item.contract_months }} บิล)</dd>
        </div>
        <div class="flex justify-between gap-2">
          <dt class="text-gray-600">บริการ</dt>
          <dd class="text-right text-gray-900">{{ serviceLabel }}</dd>
        </div>
        <div v-if="item.policy_code" class="flex justify-between gap-2">
          <dt class="shrink-0 text-gray-600">Policy</dt>
          <dd class="break-all text-right font-mono text-xs text-gray-800">{{ item.policy_code }}</dd>
        </div>
      </dl>
    </div>

    <InterestCostSummary
      :items="[item]"
      :total-contract="item.computed_total ?? 0"
      :total-net="item.computed_net_total ?? 0"
    />

    <div class="rounded-xl border border-red-100 bg-red-50/60 px-3 py-3">
      <p class="text-xs font-medium text-gray-500">ราคา/เดือน (ช่วงแรก)</p>
      <p class="mt-1 text-2xl font-bold text-red-600">
        {{ formatBaht(item.display_monthly_price) }}
        <span class="text-sm font-medium text-gray-600">/ เดือน</span>
      </p>
      <p v-if="item.display_price_note" class="mt-1 text-xs text-gray-600">
        {{ item.display_price_note }}
      </p>
    </div>

    <div v-if="item.billing_tiers?.length">
      <p class="mb-2 text-xs font-semibold text-gray-700">ช่วงบิลรายเดือน</p>
      <div class="overflow-x-auto rounded-xl border border-gray-100">
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
              v-for="tier in item.billing_tiers"
              :key="`${tier.bill_from}-${tier.bill_to}`"
              class="border-t border-gray-50"
            >
              <td class="px-3 py-2">{{ tier.bill_from }} – {{ tier.bill_to }}</td>
              <td class="px-3 py-2 font-medium">{{ formatBaht(tier.monthly_price) }}</td>
              <td class="px-3 py-2 text-gray-600">{{ tier.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="space-y-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm">
      <p class="text-xs font-semibold text-gray-700">ภาพรวมตลอดสัญญา</p>
      <div v-if="item.computed_total != null" class="flex justify-between gap-2 text-gray-600">
        <span>รวมค่างวดทุกบิล</span>
        <span class="font-medium text-gray-900">{{ formatBaht(item.computed_total) }}</span>
      </div>
      <div v-if="item.advance_amount" class="flex justify-between gap-2 text-gray-600">
        <span>รวมมัดจำ (รวมในยอดสุทธิ)</span>
        <span class="font-medium text-gray-900">{{ formatBaht(item.advance_amount) }}</span>
      </div>
      <div
        v-if="item.computed_net_total != null"
        class="flex justify-between gap-2 border-t border-gray-200 pt-2"
      >
        <span class="font-semibold text-gray-800">ยอดสุทธิโดยประมาณ</span>
        <span class="text-base font-bold text-red-700">{{ formatBaht(item.computed_net_total) }}</span>
      </div>
      <p class="text-[11px] text-gray-500">
        งวดเดือนที่ 2 เป็นต้นไป ชำระตามตารางช่วงบิลด้านบน
      </p>
    </div>
  </div>
</template>
