<script setup lang="ts">
import type { InquiryItem, SubscriptionInquiryInput } from '~~/shared/types/inquiry'
import { lineAdvanceTotal, lineMonthlyTotal, lineUnitMonthlyPrice } from '~~/shared/utils/cartQuantity'

definePageMeta({
  layout: 'default',
  breadcrumb: [
    { label: 'สินค้าทั้งหมด', to: '/products' },
    { label: 'สนใจผ่อน' },
  ],
})

import { SEO_SUBSCRIBE_INQUIRY } from '~~/shared/utils/siteSeoPresets'

useSiteSeoFromPreset(SEO_SUBSCRIBE_INQUIRY)

const cart = useInterestCart()
const combo = useComboCart()
const comboQuote = computed(() =>
  cart.count.value > 0 ? combo.quote.value : null,
)
const { $supabase } = useNuxtApp()
const submitting = ref(false)
const error = ref('')
const success = ref<{ id: string, line_summary: string } | null>(null)
const copied = ref(false)
const detailItem = ref<InquiryItem | null>(null)
const detailOpen = ref(false)

function openItemDetail(item: InquiryItem) {
  detailItem.value = item
  detailOpen.value = true
}

const { lineOaUrl } = useLineOa()
const cartReady = ref(false)

onMounted(() => {
  cartReady.value = true
})

async function handleFormSubmit(payload: SubscriptionInquiryInput) {
  error.value = ''
  if (!cart.items.value.length) {
    error.value = 'ไม่มีสินค้าในรายการ'
    return
  }

  submitting.value = true
  try {
    const headers: Record<string, string> = {}
    const { data: { session } } = await $supabase.auth.getSession()
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    const res = await $fetch<{ id: string, line_summary: string }>('/api/public/subscribe-inquiries', {
      method: 'POST',
      headers,
      body: {
        ...payload,
        items: cart.items.value.map(i => ({
          product_id: i.product_id,
          plan_id: i.plan_id,
          quantity: cart.getQuantity(i.product_id, i.plan_id),
        })),
        combo_customer_segment: combo.segment.value,
      },
    })

    success.value = res
    cart.clear()
  }
  catch (err: any) {
    error.value = err?.data?.message ?? 'ส่งคำขอไม่สำเร็จ'
  }
  finally {
    submitting.value = false
  }
}

async function copySummary() {
  if (!success.value?.line_summary) return
  try {
    await navigator.clipboard.writeText(success.value.line_summary)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch { /* ignore */ }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <main class="index-container max-w-3xl py-8 sm:py-12">
      <template v-if="success">
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <Icon name="heroicons:check-circle" class="mx-auto h-12 w-12 text-emerald-600" />
          <h1 class="mt-3 text-xl font-bold text-gray-900">ส่งคำขอแล้ว</h1>
          <p class="mt-2 text-sm text-gray-600">
            ทีมงานจะติดต่อกลับ — หรือแชท Line OA เพื่อความรวดเร็ว
          </p>
          <div class="mt-5 flex flex-wrap justify-center gap-3">
            <a
              v-if="lineOaUrl"
              :href="lineOaUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              เปิด Line OA
            </a>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
              @click="copySummary"
            >
              {{ copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความสรุป' }}
            </button>
          </div>
          <pre class="mt-4 max-h-48 overflow-auto rounded-xl bg-white p-3 text-left text-xs text-gray-700">{{ success.line_summary }}</pre>
        </div>
      </template>

      <template v-else-if="!cartReady">
        <div class="py-20 text-center text-sm text-gray-400">กำลังโหลดรายการ…</div>
      </template>

      <template v-else-if="!cart.items.value.length">
        <div class="py-20 text-center">
          <p class="text-gray-500">ยังไม่มีสินค้าในรายการ</p>
          <NuxtLink to="/products" class="mt-4 inline-block text-sm font-semibold text-red-600 hover:underline">
            ไปเลือกสินค้า
          </NuxtLink>
        </div>
      </template>

      <template v-else>
        <h1 class="text-2xl font-bold text-gray-900">สนใจผ่อน LG Subscribe</h1>
        <p class="mt-1 text-sm text-gray-500">
          ตรวจสอบรายการและกรอกข้อมูลเพื่อให้เจ้าหน้าที่ติดต่อกลับ
        </p>

        <section class="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-800">รายการที่เลือก ({{ cart.count.value }} ชิ้น)</h2>
          <ul class="mt-3 divide-y divide-gray-100">
            <li v-for="item in cart.items.value" :key="`${item.product_id}:${item.plan_id}`" class="py-3">
              <div class="flex gap-3">
                <div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                  <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="h-full w-full object-cover">
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ item.name }}</p>
                  <p class="font-mono text-xs text-gray-500">{{ item.sku }}</p>
                  <p class="text-xs text-gray-600">{{ item.contract_label }}</p>
                  <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <CartQuantityStepper
                      :quantity="cart.getQuantity(item.product_id, item.plan_id)"
                      @increment="cart.incrementQuantity(item.product_id, item.plan_id)"
                      @decrement="cart.decrementQuantity(item.product_id, item.plan_id)"
                    />
                    <div class="text-right">
                      <p class="text-sm font-semibold text-red-600">
                        {{ formatBaht(lineMonthlyTotal(item)) }}/เดือน
                      </p>
                      <p
                        v-if="cart.getQuantity(item.product_id, item.plan_id) > 1"
                        class="text-[11px] text-gray-500"
                      >
                        {{ cart.getQuantity(item.product_id, item.plan_id) }} ชิ้น × {{ formatBaht(lineUnitMonthlyPrice(item)) }}
                      </p>
                      <p
                        v-if="lineAdvanceTotal(item) > 0"
                        class="mt-0.5 text-xs font-medium text-gray-700"
                      >
                        มัดจำ {{ formatBaht(lineAdvanceTotal(item)) }}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  class="self-start text-xs text-red-500 hover:underline"
                  @click="cart.removeLine(item.product_id, item.plan_id)"
                >
                  เอาออก
                </button>
              </div>
              <button
                type="button"
                class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                @click="openItemDetail(item)"
              >
                <Icon name="heroicons:document-text" class="h-4 w-4" />
                ดูรายละเอียดที่สั่ง
              </button>
            </li>
          </ul>
          <ComboCartBenefits
            :item-count="cart.count.value"
            class="mt-4"
          />
        </section>

        <section class="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-800">สรุปค่าใช้จ่าย</h2>
          <p class="mt-0.5 text-xs text-gray-500">โดยประมาณ หากเริ่มสัญญาวันนี้</p>
          <InterestCostSummary
            class="mt-3"
            hide-heading
            :items="cart.items.value"
            :total-contract="cart.totalContract.value"
            :total-net="cart.totalNet.value"
            :combo-quote="comboQuote"
          />
        </section>

        <section class="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <SubscribeInquiryForm
            :submitting="submitting"
            :error="error"
            @submit="handleFormSubmit"
          />
        </section>
      </template>

      <CartItemDetailDialog
        :open="detailOpen"
        :item="detailItem"
        @update:open="detailOpen = $event"
      />
    </main>
  </div>
</template>
