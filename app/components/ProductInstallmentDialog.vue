<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import type { ProductPlanCardOption } from '~~/shared/types/productPlan'
import { planToInquiryItem } from '~~/shared/utils/cartItemFromPlan'
import {
  CART_ITEM_QUANTITY_MAX,
  CART_ITEM_QUANTITY_MIN,
  lineAdvanceTotal,
  lineMonthlyTotal,
  lineUnitAdvanceAmount,
  lineUnitMonthlyPrice,
} from '~~/shared/utils/cartQuantity'

const props = defineProps<{
  open: boolean
  product: Product
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  added: []
}>()

const cart = useInterestCart()
const dialogRef = ref<HTMLDialogElement | null>(null)
const selectedPlan = ref<ProductPlanCardOption | null>(null)
const pickerQuantity = ref(1)
const justAdded = ref(false)
const scheduleOpen = ref(false)


const plans = computed(() => props.product.plans ?? [])

const inCartWithSelection = computed(() =>
  selectedPlan.value
    ? cart.hasProductPlan(props.product.id, selectedPlan.value.id)
    : false,
)

const cartQuantity = computed(() =>
  selectedPlan.value
    ? cart.getQuantity(props.product.id, selectedPlan.value.id)
    : 0,
)

function syncPickerQuantity() {
  if (!selectedPlan.value) {
    pickerQuantity.value = CART_ITEM_QUANTITY_MIN
    return
  }
  const inCart = cart.getQuantity(props.product.id, selectedPlan.value.id)
  pickerQuantity.value = inCart > 0 ? inCart : CART_ITEM_QUANTITY_MIN
}

function incrementPickerQuantity() {
  pickerQuantity.value = Math.min(CART_ITEM_QUANTITY_MAX, pickerQuantity.value + 1)
}

function decrementPickerQuantity() {
  pickerQuantity.value = Math.max(CART_ITEM_QUANTITY_MIN, pickerQuantity.value - 1)
}

watch(selectedPlan, () => syncPickerQuantity())

watch(() => props.open, (open) => {
  if (open) syncPickerQuantity()
})

const pickerPreviewItem = computed(() => {
  const plan = selectedPlan.value
  if (!plan) return null
  return { ...planToInquiryItem(props.product, plan), quantity: pickerQuantity.value }
})

function close() {
  emit('update:open', false)
}

function onDialogClose() {
  emit('update:open', false)
  if (import.meta.client) document.body.style.overflow = ''
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === dialogRef.value) close()
}

function syncDialogOpenState() {
  if (!import.meta.client) return
  const el = dialogRef.value
  if (!el) return

  if (props.open) {
    if (!el.open) el.showModal()
    document.body.style.overflow = 'hidden'
  }
  else {
    if (el.open) el.close()
    document.body.style.overflow = ''
  }
}

async function present() {
  emit('update:open', true)
  await nextTick()
  syncDialogOpenState()
  if (props.open && dialogRef.value && !dialogRef.value.open) {
    await nextTick()
    dialogRef.value.showModal()
    document.body.style.overflow = 'hidden'
  }
}

function dismiss() {
  close()
  syncDialogOpenState()
}

defineExpose({ present, dismiss })

watch(() => props.open, () => nextTick(syncDialogOpenState), { flush: 'post' })

onMounted(() => nextTick(syncDialogOpenState))

onBeforeUnmount(() => {
  dialogRef.value?.close()
  if (import.meta.client) document.body.style.overflow = ''
})

function addToCart() {
  const plan = selectedPlan.value
  if (!plan) return

  cart.setProductPlanQuantity(props.product, plan, pickerQuantity.value)
  justAdded.value = true
  emit('added')
  setTimeout(() => {
    justAdded.value = false
    close()
    cart.openPanel()
  }, 400)
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="installment-dialog"
    aria-labelledby="installment-dialog-title"
    @close="onDialogClose"
    @cancel.prevent="onDialogClose"
    @click="onBackdropClick"
  >
    <div class="installment-dialog__panel" @click.stop>
      <div class="flex shrink-0 items-start gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
        <div
          v-if="product.image_url"
          class="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-gray-50"
        >
          <img :src="product.image_url" :alt="product.name" class="h-full w-full object-contain">
        </div>
        <div class="min-w-0 flex-1">
          <h2 id="installment-dialog-title" class="text-base font-semibold text-gray-900">
            รายละเอียดผ่อน
          </h2>
          <p class="mt-0.5 line-clamp-2 text-sm text-gray-700">{{ product.name }}</p>
          <p class="font-mono text-xs text-gray-500">{{ product.sku }}</p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="ปิด"
          @click="close"
        >
          <Icon name="heroicons:x-mark" class="h-5 w-5" />
        </button>
      </div>

      <div class="installment-dialog__body px-4 py-4 sm:px-5">
        <ProductPlanPicker
          v-if="plans.length"
          :key="product.id"
          :plans="plans"
          :product-name="product.name"
          :default-plan-id="product.plan_pricing?.plan_id"
          @update:selected-plan="selectedPlan = $event"
        />
        <p v-else class="py-6 text-center text-sm text-gray-500">
          ยังไม่มีแผนสัญญาสำหรับสินค้านี้
        </p>

        <div
          v-if="selectedPlan?.billing_tiers?.length"
          class="mt-4 overflow-x-auto rounded-xl border border-gray-100"
        >
          <p class="border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
            ช่วงบิลรายเดือน
          </p>
          <table class="min-w-full text-sm">
            <thead class="text-left text-xs text-gray-500">
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
                <td class="px-3 py-2">{{ tier.bill_from }} – {{ tier.bill_to }}</td>
                <td class="px-3 py-2 font-medium">{{ formatBaht(tier.monthly_price) }}</td>
                <td class="px-3 py-2 text-gray-600">{{ tier.note || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="selectedPlan"
          class="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5"
        >
          <div>
            <p class="text-sm font-medium text-gray-800">จำนวน</p>
            <p v-if="inCartWithSelection" class="text-xs text-gray-500">
              ในรายการปัจจุบัน {{ cartQuantity }} ชิ้น
            </p>
          </div>
          <CartQuantityStepper
            :quantity="pickerQuantity"
            @increment="incrementPickerQuantity"
            @decrement="decrementPickerQuantity"
          />
        </div>

        <div
          v-if="pickerPreviewItem"
          class="mt-3 rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm"
        >
          <div class="flex items-baseline justify-between gap-2">
            <span class="text-gray-600">รวม/เดือน (ช่วงแรก)</span>
            <span class="font-bold text-[#ea1917]">
              {{ formatBaht(lineMonthlyTotal(pickerPreviewItem)) }}
              <span class="text-xs font-medium text-gray-500">/เดือน</span>
            </span>
          </div>
          <p v-if="pickerQuantity > 1" class="mt-0.5 text-right text-[11px] text-gray-500">
            {{ pickerQuantity }} ชิ้น × {{ formatBaht(lineUnitMonthlyPrice(pickerPreviewItem)) }}
          </p>
          <div
            v-if="lineAdvanceTotal(pickerPreviewItem) > 0"
            class="mt-2 flex items-baseline justify-between gap-2 border-t border-red-100/80 pt-2"
          >
            <span class="text-gray-600">มัดจำรวม</span>
            <span class="font-semibold text-gray-900">
              {{ formatBaht(lineAdvanceTotal(pickerPreviewItem)) }}
              <span v-if="pickerQuantity > 1" class="text-[11px] font-normal text-gray-500">
                ({{ pickerQuantity }} × {{ formatBaht(lineUnitAdvanceAmount(pickerPreviewItem)) }})
              </span>
            </span>
          </div>
        </div>
      </div>

      <div class="flex shrink-0 flex-col gap-2 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-5">
        <button
          v-if="plans.length"
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-full border border-[#1e3354]/25 bg-[#1e3354]/5 py-2.5 text-sm font-semibold text-[#1e3354] hover:bg-[#1e3354]/10"
          @click="scheduleOpen = true"
        >
          <Icon name="heroicons:table-cells" class="h-4 w-4" />
          ดูแผนผ่อนทุกแผน
        </button>
        <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-full border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          @click="close"
        >
          ปิด
        </button>
        <button
          v-if="plans.length"
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition"
          :class="inCartWithSelection
            ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-800'
            : 'bg-[#ea1917] text-white hover:bg-red-700'"
          :disabled="!selectedPlan"
          @click="addToCart"
        >
          <Icon v-if="inCartWithSelection" name="heroicons:check" class="h-4 w-4" />
          <Icon v-else name="heroicons:shopping-cart" class="h-4 w-4" />
          <span v-if="justAdded">เพิ่มแล้ว!</span>
          <span v-else-if="inCartWithSelection">อัปเดตรายการ ({{ pickerQuantity }} ชิ้น)</span>
          <span v-else>ใส่ตะกร้า{{ pickerQuantity > 1 ? ` (${pickerQuantity} ชิ้น)` : '' }}</span>
        </button>
        </div>
      </div>
    </div>
  </dialog>

  <ProductInstallmentScheduleDialog
    :open="scheduleOpen"
    :product="product"
    @update:open="scheduleOpen = $event"
  />
</template>

<style scoped>
.installment-dialog {
  /* โปร่งใส — เนื้อหาอยู่ใน panel; overlay มาจาก ::backdrop */
  width: min(100%, 32rem);
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
  margin: auto;
  padding: 0;
  border: none;
  background: transparent;
  overflow: visible;
}

.installment-dialog::backdrop {
  background-color: rgb(0 0 0 / 0.5);
  backdrop-filter: blur(2px);
}

.installment-dialog__panel {
  display: flex;
  max-height: min(90vh, 640px);
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}

.installment-dialog__body {
  flex: 1;
  overflow-y: auto;
}
</style>
