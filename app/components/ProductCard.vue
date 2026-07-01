<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import { productWarrantyLine } from '~/composables/useProductCardText'
import {
  cardMonthlyPrice,
  cardPricePrefix,
  productHasPlanPricing,
} from '~/composables/useProductPlanPricing'
import { defaultPlanForProduct } from '~~/shared/utils/cartItemFromPlan'
import { planHasGiftItems } from '~~/shared/utils/planGiftDisplay'

const props = defineProps<{
  product: Product
  /** ชื่อบนการ์ด (เช่น ชื่อกลุ่มเมื่อมีหลายขนาด) */
  titleOverride?: string
}>()

const emit = defineEmits<{
  subscribe: [product: Product]
  compare: [product: Product, checked: boolean]
}>()

const cart = useInterestCart()
const compared = ref(false)
const copied = ref(false)
const planDialogOpen = ref(false)
const scheduleOpen = ref(false)
const installmentDialogRef = ref<{ present: () => Promise<void> } | null>(null)


const displayTitle = computed(() => props.titleOverride ?? props.product.name)
const hasPricing = computed(() => productHasPlanPricing(props.product))
const pricing = computed(() => props.product.plan_pricing)

const monthlyPrice = computed(() => cardMonthlyPrice(pricing.value))
const pricePrefix = computed(() => cardPricePrefix(pricing.value))
const priceNote = computed(() => pricing.value?.display_price_note)

const inCart = computed(() => cart.hasProduct(props.product.id))
const warrantyText = computed(() => productWarrantyLine(props.product))
const promoText = computed(() => props.product.headline || 'ยิ่งซับมาก ยิ่งลดมาก!')
const defaultPlan = computed(() => defaultPlanForProduct(props.product))
const defaultPlanGifts = computed(() =>
  defaultPlan.value && planHasGiftItems(defaultPlan.value) ? defaultPlan.value.gift_items : [],
)

async function copySku() {
  try {
    await navigator.clipboard.writeText(props.product.sku)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  }
  catch {
    /* ignore */
  }
}

function onCompareChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  compared.value = checked
  emit('compare', props.product, checked)
}

async function openPlanDialog() {
  planDialogOpen.value = true
  await nextTick()
  await installmentDialogRef.value?.present()
}

function onAddedToCart() {
  emit('subscribe', props.product)
}
</script>

<template>
  <article
    class="flex h-full flex-col rounded-sm border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
  >
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <span
        class="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-semibold text-white"
      >
        Subscription
      </span>
      <span
        v-if="inCart"
        class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
      >
        <Icon name="heroicons:check" class="h-3 w-3" />
        ในรายการ
      </span>
    </div>

    <NuxtLink
      :to="`/products/${product.id}`"
      class="mb-2 text-sm font-normal text-gray-900 underline decoration-gray-400 underline-offset-2 hover:text-red-600"
    >
      {{ displayTitle }}
    </NuxtLink>

    <div class="mb-4 flex items-center gap-2 text-xs text-gray-600">
      <span class="font-medium tracking-wide">{{ product.sku }}</span>
      <button
        type="button"
        class="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        :title="copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'"
        @click.prevent="copySku"
      >
        <Icon :name="copied ? 'heroicons:check' : 'heroicons:clipboard-document'" class="h-3.5 w-3.5" />
      </button>
    </div>

    <div class="relative mb-4 flex flex-1 items-center justify-center py-2">
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        class="max-h-44 w-full object-contain"
      >
      <div v-else class="flex h-44 w-full items-center justify-center bg-gray-50">
        <Icon name="heroicons:photo" class="h-12 w-12 text-gray-300" />
      </div>
    </div>

    <p class="mb-1 text-sm font-medium text-red-600">
      {{ promoText }}
    </p>

    <div v-if="hasPricing" class="flex flex-wrap items-baseline gap-2">
      <p class="text-3xl font-bold tracking-tight text-gray-900">
        <span v-if="pricePrefix" class="text-lg font-semibold text-gray-600">{{ pricePrefix }}</span>
        {{ formatBaht(monthlyPrice!) }}
      </p>
    </div>
    <p v-else class="text-lg font-semibold text-gray-500">
      สอบถามราคา
    </p>

    <div class="mt-1 space-y-0.5 text-xs text-gray-600">
      <p v-if="priceNote">{{ priceNote }}</p>
      <p v-else-if="hasPricing && pricing">{{ pricing.contract_label }}</p>
      <p>{{ warrantyText }}</p>
    </div>

    <PlanGiftsList
      v-if="defaultPlanGifts.length"
      :gifts="defaultPlanGifts"
      compact
      class="mt-2"
    />

    <component
      :is="product.purchase_only_url ? 'a' : 'span'"
      :href="product.purchase_only_url || undefined"
      class="mt-0.5 inline-block text-xs text-gray-900 underline decoration-gray-400 hover:text-red-600"
    >
      {{ product.purchase_only_label || 'หรือซื้อเฉพาะสินค้าเท่านั้น' }}
    </component>

    <div class="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-4">
      <template v-if="hasPricing">
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#ea1917] bg-white py-2.5 text-sm font-semibold text-[#ea1917] transition hover:bg-red-50"
          @click="openPlanDialog"
        >
          <Icon name="heroicons:document-text" class="h-4 w-4" />
          รายละเอียดผ่อน
        </button>
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-full border border-[#1e3354]/25 bg-[#1e3354]/5 py-2.5 text-sm font-semibold text-[#1e3354] transition hover:bg-[#1e3354]/10"
          @click="scheduleOpen = true"
        >
          <Icon name="heroicons:table-cells" class="h-4 w-4" />
          ดูแผนผ่อน
        </button>
      </template>
      <NuxtLink
        v-else
        :to="`/products/${product.id}`"
        class="flex w-full items-center justify-center rounded-full border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        ดูรายละเอียดสินค้า
      </NuxtLink>

      <div class="flex items-center justify-between gap-2">
        <NuxtLink
          :to="`/products/${product.id}`"
          class="text-xs text-gray-900 hover:text-red-600"
        >
          เรียนรู้เพิ่มเติม &gt;
        </NuxtLink>
        <label class="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
          <input
            type="checkbox"
            class="h-3.5 w-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
            :checked="compared"
            @change="onCompareChange"
          >
          เปรียบเทียบ
        </label>
      </div>
    </div>

  </article>

  <ClientOnly v-if="hasPricing">
    <ProductInstallmentDialog
      ref="installmentDialogRef"
      :open="planDialogOpen"
      :product="product"
      @update:open="planDialogOpen = $event"
      @added="onAddedToCart"
    />
    <ProductInstallmentScheduleDialog
      :open="scheduleOpen"
      :product="product"
      @update:open="scheduleOpen = $event"
    />
  </ClientOnly>
</template>
