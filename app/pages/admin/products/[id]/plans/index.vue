<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import type { MainCategory } from '~~/shared/types/main-category'
import type { Category } from '~~/shared/types/category'
import type {
  CreatePlanInput,
  PlanBillingTierInput,
  ProductPlan,
  ProductPlansResponse,
  ServiceMode,
  UpdatePlanInput,
} from '~~/shared/types/productPlan'
import PromotionGiftProductPicker from '~/components/admin/promotion/PromotionGiftProductPicker.vue'
import { formatBaht } from '~/composables/useProductPricing'
import { totalContractAmount, totalNetAmount } from '~~/shared/utils/planPricing'
import { normalizePlanServiceInterval, planShowsServiceInterval } from '~~/shared/utils/planDisplay'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const productId = route.params.id as string

const { data: product } = await useFetch<Product>(() => `/api/products/${productId}`, {
  key: `admin-product-header-${productId}`,
})

const { data: catalogProducts } = await useFetch<Product[]>('/api/products', {
  query: { status: 'published' },
  default: () => [],
})
const { data: mainCategories } = await useFetch<MainCategory[]>('/api/main-categories', { default: () => [] })
const { data: categories } = await useFetch<Category[]>('/api/categories', { default: () => [] })

type GiftDraft = {
  localId: string
  product_id: string
  label: string
}

const { data: plansData, pending, error: fetchError, refresh } = await useFetch<ProductPlansResponse>(
  () => `/api/admin/products/${productId}/plans`,
  { key: `admin-product-plans-${productId}` },
)

const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400'

const serviceModeLabels: Record<ServiceMode, string> = {
  visit: 'Visit (ช่างเข้าบ้าน)',
  self: 'Self (ส่งอะไหล่)',
  none: 'No service',
}

function emptyTier(): PlanBillingTierInput {
  return { bill_from: 1, bill_to: 12, monthly_price: 0, note: '', sort_order: 0 }
}

function emptyForm(): CreatePlanInput {
  return {
    policy_code: null,
    contract_years: 5,
    contract_months: 60,
    service_mode: 'visit',
    service_interval_months: 6,
    sale_type: 'subscription',
    list_price: null,
    promo_price: null,
    advance_amount: null,
    advance_note: null,
    plan_title: null,
    is_active: true,
    sort_order: 0,
    billing_tiers: [emptyTier()],
    has_gift: false,
  }
}

function emptyGift(): GiftDraft {
  return {
    localId: crypto.randomUUID(),
    product_id: '',
    label: '',
  }
}

const modalOpen = ref(false)
const editingPlanId = ref<string | null>(null)
const form = reactive(emptyForm())
const planGifts = ref<GiftDraft[]>([])
const formError = ref('')
const saving = ref(false)

const contractMonthsComputed = computed(() => form.contract_months || (form.contract_years * 12))

watch(() => form.contract_years, (years) => {
  if (!editingPlanId.value) {
    form.contract_months = years * 12
    syncLastTierEnd()
  }
})

watch(() => form.service_mode, (mode) => {
  if (mode === 'none') {
    form.service_interval_months = null
  }
  else if (form.service_interval_months == null || form.service_interval_months < 1) {
    form.service_interval_months = 6
  }
})

function syncLastTierEnd() {
  const months = contractMonthsComputed.value
  if (!form.billing_tiers.length) return
  form.billing_tiers[form.billing_tiers.length - 1]!.bill_to = months
}

const computedTotal = computed(() => totalContractAmount(form.billing_tiers))
const computedNetTotal = computed(() => totalNetAmount(computedTotal.value, form.advance_amount))

function tiersSummary(plan: ProductPlan) {
  const tiers = plan.billing_tiers ?? []
  if (!tiers.length) return '—'
  return tiers
    .map(t => `${t.bill_from}-${t.bill_to}: ${formatBaht(t.monthly_price)}`)
    .join(' · ')
}

function openCreate() {
  editingPlanId.value = null
  Object.assign(form, emptyForm())
  planGifts.value = []
  form.sort_order = plansData.value?.plans.length ?? 0
  syncLastTierEnd()
  formError.value = ''
  modalOpen.value = true
}

function openEdit(plan: ProductPlan) {
  editingPlanId.value = plan.id
  Object.assign(form, {
    policy_code: plan.policy_code,
    contract_years: plan.contract_years,
    contract_months: plan.contract_months,
    service_mode: plan.service_mode,
    service_interval_months: plan.service_interval_months,
    sale_type: plan.sale_type,
    list_price: plan.list_price,
    promo_price: null,
    advance_amount: plan.advance_amount,
    advance_note: plan.advance_note,
    plan_title: plan.plan_title,
    is_active: plan.is_active,
    sort_order: plan.sort_order,
    has_gift: plan.has_gift,
    billing_tiers: (plan.billing_tiers ?? []).map(t => ({
      bill_from: t.bill_from,
      bill_to: t.bill_to,
      monthly_price: t.monthly_price,
      note: t.note,
      sort_order: t.sort_order,
    })),
  })
  planGifts.value = (plan.gift_items ?? []).map(gift => ({
    localId: crypto.randomUUID(),
    product_id: gift.product_id,
    label: gift.label ?? '',
  }))
  if (!form.billing_tiers.length) form.billing_tiers = [emptyTier()]
  formError.value = ''
  modalOpen.value = true
}

function onHasGiftChange(checked: boolean) {
  form.has_gift = checked
  if (!checked) planGifts.value = []
}

function addGift() {
  planGifts.value = [...planGifts.value, emptyGift()]
}

function removeGift(localId: string) {
  planGifts.value = planGifts.value.filter(g => g.localId !== localId)
}

function addTier() {
  const last = form.billing_tiers[form.billing_tiers.length - 1]
  const nextFrom = last ? last.bill_to + 1 : 1
  form.billing_tiers.push({
    bill_from: nextFrom,
    bill_to: contractMonthsComputed.value,
    monthly_price: 0,
    note: '',
    sort_order: form.billing_tiers.length,
  })
}

function removeTier(index: number) {
  if (form.billing_tiers.length <= 1) return
  form.billing_tiers.splice(index, 1)
  syncLastTierEnd()
}

async function savePlan() {
  formError.value = ''
  saving.value = true
  try {
    syncLastTierEnd()
    const payload = {
      ...form,
      sale_type: 'subscription' as const,
      contract_months: contractMonthsComputed.value,
      service_interval_months: normalizePlanServiceInterval(form.service_mode, form.service_interval_months),
      billing_tiers: form.billing_tiers.map((t, i) => ({ ...t, sort_order: i })),
      has_gift: form.has_gift,
      gift_items: form.has_gift
        ? planGifts.value
            .filter(g => g.product_id)
            .map((gift, index) => ({
              product_id: gift.product_id,
              label: gift.label.trim() || null,
              sort_order: index,
            }))
        : [],
    }

    if (editingPlanId.value) {
      await $fetch(`/api/admin/products/${productId}/plans/${editingPlanId.value}`, {
        method: 'PATCH',
        body: payload satisfies UpdatePlanInput,
      })
    } else {
      await $fetch(`/api/admin/products/${productId}/plans`, {
        method: 'POST',
        body: payload,
      })
    }

    modalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    formError.value = (e as { data?: { message?: string }, message?: string }).data?.message
      ?? (e as { message?: string }).message
      ?? 'บันทึกไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

async function toggleActive(plan: ProductPlan) {
  try {
    await $fetch(`/api/admin/products/${productId}/plans/${plan.id}`, {
      method: 'PATCH',
      body: { is_active: !plan.is_active },
    })
    await refresh()
  } catch (e: unknown) {
    alert((e as { data?: { message?: string } }).data?.message ?? 'อัปเดตสถานะไม่สำเร็จ')
  }
}

async function removePlan(plan: ProductPlan) {
  if (!confirm(`ลบแผน "${plan.contract_label}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/admin/products/${productId}/plans/${plan.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: unknown) {
    alert((e as { data?: { message?: string } }).data?.message ?? 'ลบไม่สำเร็จ')
  }
}

</script>

<template>
  <div class="pb-24">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <NuxtLink
        :to="`/admin/products/${productId}`"
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
      >
        <Icon name="heroicons:arrow-left" class="h-4 w-4" />
        กลับแก้ไขสินค้า
      </NuxtLink>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        @click="openCreate"
      >
        <Icon name="heroicons:plus" class="h-4 w-4" />
        เพิ่มแผนสัญญา
      </button>
    </div>

    <AdminPageHeader
      :title="product ? `แผนสัญญา — ${product.name}` : 'แผนสัญญา'"
      :description="product ? `รหัสสินค้า: ${product.sku}` : 'กำลังโหลด...'"
    />

    <div class="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      ราคาแผนสัญญานี้เป็น source of truth สำหรับหน้าร้าน (Phase 2) — ราคา legacy ใน tab สินค้าใช้ import เท่านั้น
      <span class="mt-1 block text-amber-800">
        แผนเริ่มต้นบนหน้าร้าน = แผนที่เปิดใช้งานและมีลำดับน้อยที่สุด (เรียงตามคอลัมน์ลำดับ / ลำดับที่เพิ่ม) — ระบบตั้งให้อัตโนมัติ ไม่ต้องเลือกเอง
      </span>
    </div>

    <div v-if="pending" class="py-16 text-center text-gray-400">กำลังโหลด...</div>
    <div v-else-if="fetchError" class="py-16 text-center text-red-500">โหลดไม่สำเร็จ</div>

    <div v-else class="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table class="min-w-full text-sm">
        <thead class="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
          <tr>
            <th class="px-4 py-3">สัญญา</th>
            <th class="px-4 py-3">บริการ</th>
            <th class="px-4 py-3">ช่วงบิล</th>
            <th class="px-4 py-3">รวมค่างวด</th>
            <th class="px-4 py-3">มัดจำ</th>
            <th class="px-4 py-3">ของแถม</th>
            <th class="px-4 py-3">ยอดสุทธิ</th>
            <th class="px-4 py-3">สถานะ</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="!plansData?.plans.length">
            <td colspan="9" class="px-4 py-10 text-center text-gray-400">ยังไม่มีแผนสัญญา</td>
          </tr>
          <tr
            v-for="plan in plansData?.plans ?? []"
            :key="plan.id"
            class="border-b border-gray-50 hover:bg-gray-50/50"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900">{{ plan.plan_title || plan.contract_label }}</p>
              <p v-if="plan.plan_title" class="text-xs text-gray-500">{{ plan.contract_label }}</p>
              <p class="text-xs text-gray-500">
                {{ plan.contract_years }} ปี · {{ plan.contract_months }} บิล · ลำดับ {{ plan.sort_order }}
              </p>
            </td>
            <td class="px-4 py-3 text-gray-700">
              {{ serviceModeLabels[plan.service_mode] }}
              <span v-if="planShowsServiceInterval(plan)" class="block text-xs text-gray-500">
                ทุก {{ plan.service_interval_months }} เดือน
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ tiersSummary(plan) }}</td>
            <td class="px-4 py-3 font-medium text-red-600">
              {{ formatBaht(plan.computed_total) }}
            </td>
            <td class="px-4 py-3 text-xs text-gray-700">
              <div>{{ formatBaht(plan.advance_amount ?? 0) }}</div>
              <div v-if="plan.advance_note" class="text-gray-500">{{ plan.advance_note }}</div>
            </td>
            <td class="px-4 py-3 text-xs text-gray-700">
              <span v-if="plan.has_gift && plan.gift_items?.length">{{ plan.gift_items.length }} ชิ้น</span>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td class="px-4 py-3 font-semibold text-red-700">
              {{ formatBaht(plan.computed_net_total ?? ((plan.computed_total ?? 0) + (plan.advance_amount ?? 0))) }}
            </td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                @click="toggleActive(plan)"
              >
                {{ plan.is_active ? 'เปิด' : 'ปิด' }}
              </button>
            </td>
            <td class="px-4 py-3 text-right">
              <button type="button" class="mr-2 text-xs text-gray-600 hover:text-red-600" @click="openEdit(plan)">
                แก้ไข
              </button>
              <button type="button" class="text-xs text-gray-400 hover:text-red-600" @click="removePlan(plan)">
                ลบ
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12"
        @click.self="modalOpen = false"
      >
        <div class="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ editingPlanId ? 'แก้ไขแผนสัญญา' : 'เพิ่มแผนสัญญา' }}
          </h2>

          <form class="mt-4 space-y-6" @submit.prevent="savePlan">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">หัวข้อแผนสัญญา</label>
              <input v-model="form.plan_title" placeholder="เช่น ผ่อน 0% 6 เดือนแรก" :class="inputClass">
              <p class="mt-1 text-xs text-gray-500">แสดงตอนลูกค้าเลือกแผน (แทนหมายเหตุช่วงบิลแรก)</p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">ระยะสัญญา (ปี) *</label>
                <input v-model.number="form.contract_years" type="number" min="1" required :class="inputClass">
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">จำนวนบิล (contract_months)</label>
                <input v-model.number="form.contract_months" type="number" min="1" :class="inputClass">
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">ประเภทบริการ *</label>
                <select v-model="form.service_mode" :class="inputClass">
                  <option value="visit">Visit (ช่างเข้าบ้าน)</option>
                  <option value="self">Self (ส่งอะไหล่)</option>
                  <option value="none">No service</option>
                </select>
              </div>
              <div v-if="form.service_mode !== 'none'">
                <label class="mb-1 block text-xs font-medium text-gray-600">รอบบริการ (เดือน) *</label>
                <input v-model.number="form.service_interval_months" type="number" min="1" required :class="inputClass">
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">แบบการขาย</label>
                <input value="Subscription" disabled :class="[inputClass, 'bg-gray-50 text-gray-500']">
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">ลำดับ (น้อย = แสดงก่อน / แผนเริ่มต้น)</label>
                <input v-model.number="form.sort_order" type="number" min="0" :class="inputClass">
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">ราคาปกติ (PDF)</label>
                <input v-model.number="form.list_price" type="number" min="0" step="0.01" :class="inputClass">
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">มัดจำล่วงหน้า (บาท)</label>
                <input v-model.number="form.advance_amount" type="number" min="0" step="0.01" :class="inputClass">
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">หมายเหตุมัดจำ</label>
                <input v-model="form.advance_note" placeholder="เช่น มัดจำล่วงหน้า 10 เดือน" :class="inputClass">
              </div>
            </div>

            <section>
              <div class="mb-2 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-800">ช่วงบิลรายเดือน</h3>
                <button type="button" class="text-xs text-red-600 hover:underline" @click="addTier">
                  + เพิ่มช่วง
                </button>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(tier, index) in form.billing_tiers"
                  :key="index"
                  class="grid gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:grid-cols-12"
                >
                  <div class="sm:col-span-2">
                    <label class="mb-1 block text-xs text-gray-500">บิลจาก</label>
                    <input v-model.number="tier.bill_from" type="number" min="1" :class="inputClass">
                  </div>
                  <div class="sm:col-span-2">
                    <label class="mb-1 block text-xs text-gray-500">บิลถึง</label>
                    <input v-model.number="tier.bill_to" type="number" min="1" :class="inputClass">
                  </div>
                  <div class="sm:col-span-3">
                    <label class="mb-1 block text-xs text-gray-500">ราคา/เดือน</label>
                    <input v-model.number="tier.monthly_price" type="number" min="0" step="0.01" :class="inputClass">
                  </div>
                  <div class="sm:col-span-4">
                    <label class="mb-1 block text-xs text-gray-500">หมายเหตุ</label>
                    <input v-model="tier.note" placeholder="6 บิลแรก" :class="inputClass">
                  </div>
                  <div class="flex items-end sm:col-span-1">
                    <button
                      type="button"
                      class="rounded p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                      :disabled="form.billing_tiers.length <= 1"
                      @click="removeTier(index)"
                    >
                      <Icon name="heroicons:trash" class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div class="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm">
                <div>
                  <span class="text-gray-600">รวมค่างวด (คำนวณ): </span>
                  <span class="font-bold text-red-600">{{ formatBaht(computedTotal) }}</span>
                </div>
                <div class="mt-1">
                  <span class="text-gray-600">มัดจำล่วงหน้า: </span>
                  <span class="font-bold text-gray-800">{{ formatBaht(form.advance_amount ?? 0) }}</span>
                  <span v-if="form.advance_note" class="ml-2 text-xs text-gray-500">{{ form.advance_note }}</span>
                </div>
                <div class="mt-1">
                  <span class="text-gray-600">ยอดสุทธิ: </span>
                  <span class="font-bold text-red-700">{{ formatBaht(computedNetTotal) }}</span>
                </div>
              </div>
            </section>

            <section class="space-y-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
              <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                <input
                  :checked="form.has_gift"
                  type="checkbox"
                  class="rounded border-gray-300"
                  @change="onHasGiftChange(($event.target as HTMLInputElement).checked)"
                >
                มีของแถมในแผนนี้
              </label>

              <template v-if="form.has_gift">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-xs font-semibold text-amber-900">รายการของแถม</p>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-50"
                    @click="addGift"
                  >
                    <Icon name="heroicons:plus" class="h-3.5 w-3.5" />
                    เพิ่มของแถม
                  </button>
                </div>

                <p v-if="!planGifts.length" class="text-xs text-amber-800/80">
                  ยังไม่มีของแถม — กด «เพิ่มของแถม» แล้วเลือกหมวดหมู่ → สินค้า
                </p>

                <div
                  v-for="(gift, giftIndex) in planGifts"
                  :key="gift.localId"
                  class="space-y-3 rounded-xl border border-amber-200/70 bg-white/80 p-3"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-xs font-medium text-gray-700">ของแถมชิ้นที่ {{ giftIndex + 1 }}</p>
                    <button type="button" class="text-xs text-red-500 hover:underline" @click="removeGift(gift.localId)">
                      ลบ
                    </button>
                  </div>
                  <PromotionGiftProductPicker
                    v-model="gift.product_id"
                    :catalog-products="catalogProducts ?? []"
                    :main-categories="mainCategories ?? []"
                    :categories="categories ?? []"
                  />
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600">ข้อความแสดง (optional)</label>
                    <input
                      v-model="gift.label"
                      type="text"
                      placeholder="เช่น แถม Soundbar XX"
                      :class="inputClass"
                    >
                  </div>
                </div>
              </template>
            </section>

            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.is_active" type="checkbox" class="rounded text-red-500">
              เปิดใช้งาน
            </label>

            <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

            <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                @click="modalOpen = false"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                :disabled="saving"
              >
                {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
