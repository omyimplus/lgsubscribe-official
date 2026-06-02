<script setup lang="ts">
import type { InquiryItem } from '~~/shared/types/inquiry'

const cart = useInterestCart()
const route = useRoute()

const detailItem = ref<InquiryItem | null>(null)
const detailOpen = ref(false)
const scheduleOpen = ref(false)

watch(() => route.fullPath, () => {
  cart.closePanel()
  detailOpen.value = false
})

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (scheduleOpen.value) {
    scheduleOpen.value = false
    return
  }
  if (detailOpen.value) {
    detailOpen.value = false
    return
  }
  if (cart.isOpen.value) cart.closePanel()
}

watch(() => cart.isOpen.value, (open) => {
  if (!import.meta.client) return
  if (open) {
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeydown)
  }
  else {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', onKeydown)
    detailOpen.value = false
    scheduleOpen.value = false
  }
})

onUnmounted(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})

function openItemDetail(item: InquiryItem) {
  detailItem.value = item
  detailOpen.value = true
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <button
        v-if="cart.isOpen.value"
        type="button"
        class="fixed inset-0 z-50 bg-black/40"
        aria-label="ปิดรายการ"
        @click="cart.closePanel()"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="cart.isOpen.value"
        class="interest-cart-panel fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-full flex-col bg-[#f7f5f2] shadow-2xl sm:max-w-md"
        role="dialog"
        aria-modal="true"
        aria-label="รายการสนใจผ่อน"
      >
        <header class="shrink-0 border-b border-gray-200 bg-white px-4 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] sm:px-5 sm:py-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-gray-900">
                สนใจผ่อน
              </h2>
              <p class="mt-0.5 text-sm text-gray-500">
                {{ cart.count.value }} รายการ
              </p>
            </div>
            <button
              type="button"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
              aria-label="ปิด"
              @click="cart.closePanel()"
            >
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </button>
          </div>
        </header>

        <div v-if="!cart.count.value" class="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <Icon name="heroicons:shopping-bag" class="h-12 w-12 text-gray-300" />
          <p class="mt-3 text-sm text-gray-500">
            ยังไม่มีสินค้าในรายการ
          </p>
          <NuxtLink
            to="/products"
            class="mt-4 text-sm font-semibold text-red-600 hover:underline"
            @click="cart.closePanel()"
          >
            ไปเลือกสินค้า
          </NuxtLink>
        </div>

        <template v-else>
          <div class="flex min-h-0 flex-1 flex-col">
            <!-- เลื่อนได้เฉพาะรายการสินค้า -->
            <div class="interest-cart-panel__items min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <ul class="space-y-3 px-4 py-4 sm:px-5">
                <li
                  v-for="item in cart.items.value"
                  :key="item.product_id"
                  class="rounded-xl border border-gray-200/90 bg-white p-3 shadow-sm"
                >
                  <div class="flex gap-3">
                    <div class="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      <img
                        v-if="item.image_url"
                        :src="item.image_url"
                        :alt="item.name"
                        class="h-full w-full object-contain p-1"
                      >
                      <div
                        v-else
                        class="flex h-full w-full items-center justify-center"
                      >
                        <Icon name="heroicons:photo" class="h-6 w-6 text-gray-300" />
                      </div>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-start justify-between gap-1">
                        <p class="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
                          {{ item.name }}
                        </p>
                        <button
                          type="button"
                          class="shrink-0 p-1 text-gray-400 transition hover:text-red-600"
                          aria-label="เอาออก"
                          @click="cart.removeProduct(item.product_id)"
                        >
                          <Icon name="heroicons:trash" class="h-4 w-4" />
                        </button>
                      </div>
                      <p class="mt-1 font-mono text-xs text-gray-500">
                        {{ item.sku }}
                      </p>
                      <p class="mt-0.5 text-xs text-gray-600">
                        {{ item.contract_label }}
                      </p>
                      <p class="mt-1.5 text-sm font-bold text-[#ea1917]">
                        {{ formatBaht(item.display_monthly_price) }}
                        <span class="text-xs font-medium text-gray-500">/เดือน</span>
                      </p>
                      <button
                        type="button"
                        class="mt-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-[#ea1917] hover:underline"
                        @click="openItemDetail(item)"
                      >
                        ดูรายละเอียดที่สั่ง
                        <Icon name="heroicons:chevron-right" class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <!-- panel ล่างติดขอบ: combo + ปุ่ม (ตาม mockup) -->
            <footer class="interest-cart-panel__dock shrink-0">
              <div class="interest-cart-panel__combo-wrap">
                <ComboCartBenefits
                  :item-count="cart.count.value"
                  variant="docked"
                />
              </div>

              <div
                class="interest-cart-panel__actions border-t border-gray-200 bg-white px-4 pt-2 sm:px-5"
                style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
              >
                <button
                  type="button"
                  class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                  @click="scheduleOpen = true"
                >
                  <Icon name="heroicons:table-cells" class="h-4 w-4 text-gray-500" />
                  ดูตารางผ่อน (ตะกร้า)
                </button>

                <div class="interest-cart-panel__actions-row mt-2 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto sm:shrink-0"
                    @click="cart.clear()"
                  >
                    ล้างทั้งหมด
                  </button>
                  <NuxtLink
                    to="/subscribe/inquiry"
                    class="inline-flex w-full min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#ea1917] py-2.5 text-sm font-semibold text-white transition hover:bg-[#d41715] sm:w-auto"
                    @click="cart.closePanel()"
                  >
                    ดำเนินการต่อ
                    <Icon name="heroicons:arrow-right" class="h-4 w-4 shrink-0" />
                  </NuxtLink>
                </div>
              </div>
            </footer>
          </div>
        </template>
      </aside>
    </Transition>
  </Teleport>

  <CartItemDetailDialog
    :open="detailOpen"
    :item="detailItem"
    @update:open="detailOpen = $event"
  />

  <CartInstallmentScheduleDialog
    :open="scheduleOpen"
    :items="cart.items.value"
    @update:open="scheduleOpen = $event"
  />
</template>

<style scoped>
/* panel ล่าง — จำกัดความสูงบนมือถือให้รายการสินค้าเห็นได้มากขึ้น */
.interest-cart-panel__dock {
  display: flex;
  max-height: min(40dvh, 20rem);
  flex-direction: column;
  box-shadow: 0 -4px 20px rgb(0 0 0 / 0.06);
}

.interest-cart-panel__combo-wrap {
  min-height: 0;
  flex: 1 1 auto;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.interest-cart-panel__actions {
  flex-shrink: 0;
}

.interest-cart-panel__items {
  flex: 1 1 auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 640px) {
  .interest-cart-panel__dock {
    max-height: min(42vh, 22rem);
  }
}

/* จอเตี้ย (มือถือแนวนอน) */
@media (max-height: 32rem) {
  .interest-cart-panel__dock {
    max-height: min(36dvh, 16rem);
  }
}
</style>
