<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import { buildProductInstallmentSchedule } from '~~/shared/utils/productInstallmentSchedule'

const props = defineProps<{
  open: boolean
  product: Product
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

const schedule = computed(() => buildProductInstallmentSchedule(props.product))

const planCount = computed(() => props.product.plans?.length ?? 0)

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

watch(() => props.open, () => nextTick(syncDialogOpenState), { flush: 'post' })
onMounted(() => nextTick(syncDialogOpenState))
onBeforeUnmount(() => {
  dialogRef.value?.close()
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <dialog
    ref="dialogRef"
    class="schedule-dialog"
    aria-labelledby="product-schedule-title"
    @close="onDialogClose"
    @cancel.prevent="onDialogClose"
    @click="onBackdropClick"
  >
    <div class="schedule-dialog__panel" @click.stop>
      <div class="flex shrink-0 items-start gap-3 border-b border-gray-200 px-4 py-3 sm:px-5">
        <div
          v-if="product.image_url"
          class="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-gray-50"
        >
          <img :src="product.image_url" :alt="product.name" class="h-full w-full object-contain">
        </div>
        <div class="min-w-0 flex-1">
          <h2 id="product-schedule-title" class="text-base font-bold text-gray-900 sm:text-lg">
            แผนผ่อนที่มีให้เลือก
          </h2>
          <p class="mt-0.5 line-clamp-2 text-sm text-gray-700">
            {{ product.name }}
          </p>
          <p class="font-mono text-xs text-gray-500">
            {{ product.sku }}
            <span v-if="planCount"> · {{ planCount }} แผนสัญญา</span>
          </p>
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

      <div class="schedule-dialog__body">
        <p class="mx-4 mt-4 rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2 text-center text-xs text-sky-900 sm:mx-5">
          เปรียบเทียบระยะเวลาสัญญา รูปแบบบริการ และค่างวดรายเดือน — เลือกแผนที่ต้องการก่อนใส่ตะกร้า
        </p>

        <div
          v-if="!schedule"
          class="px-6 py-16 text-center text-sm text-gray-500"
        >
          ยังไม่มีแผนสัญญาสำหรับสินค้านี้
        </div>

        <InstallmentScheduleTable
          v-else
          :schedule="schedule"
          variant="product"
        />

        <ProductSubscribeValueSection
          variant="embedded"
          :product="product"
          class="mx-4 mb-4 mt-5 border-t border-gray-200 pt-5 sm:mx-5"
        />
      </div>

      <div class="flex shrink-0 justify-end border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
        <button
          type="button"
          class="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          @click="close"
        >
          ปิด
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.schedule-dialog {
  width: min(100%, 72rem);
  max-width: calc(100vw - 1rem);
  max-height: calc(100dvh - 1rem);
  margin: auto;
  padding: 0;
  border: none;
  background: transparent;
  overflow: visible;
}

.schedule-dialog::backdrop {
  background-color: rgb(0 0 0 / 0.55);
  backdrop-filter: blur(2px);
}

.schedule-dialog__panel {
  display: flex;
  max-height: min(92dvh, 900px);
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.3);
}

.schedule-dialog__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 80px,
    rgb(0 0 0 / 0.02) 80px,
    rgb(0 0 0 / 0.02) 160px
  );
}

@media (max-width: 639px) {
  .schedule-dialog {
    width: 100%;
    max-width: 100%;
    max-height: 100dvh;
    height: 100%;
    margin: 0;
  }

  .schedule-dialog__panel {
    height: 100%;
    max-height: 100dvh;
    border-radius: 0;
  }
}
</style>
