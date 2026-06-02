<script setup lang="ts">
import type { InquiryItem } from '~~/shared/types/inquiry'
import { buildInstallmentSchedule } from '~~/shared/utils/installmentSchedule'

const props = defineProps<{
  open: boolean
  items: InquiryItem[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const combo = useComboCart()
const dialogRef = ref<HTMLDialogElement | null>(null)

const schedule = computed(() =>
  buildInstallmentSchedule(props.items, combo.quote.value),
)

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
    aria-labelledby="cart-schedule-title"
    @close="onDialogClose"
    @cancel.prevent="onDialogClose"
    @click="onBackdropClick"
  >
    <div class="schedule-dialog__panel" @click.stop>
      <div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5">
        <div class="min-w-0">
          <h2 id="cart-schedule-title" class="text-base font-bold text-gray-900 sm:text-lg">
            ตารางชำระรายเดือน (ตะกร้า)
          </h2>
          <p class="mt-0.5 text-xs text-gray-500">
            {{ items.length }} รายการในตะกร้า · รวมส่วนลด Combo
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="ปิด"
          @click="close"
        >
          <Icon name="heroicons:x-mark" class="h-5 w-5" />
        </button>
      </div>

      <div class="schedule-dialog__body">
        <div
          v-if="!schedule"
          class="px-6 py-16 text-center text-sm text-gray-500"
        >
          ไม่มีรายการในตะกร้า
        </div>

        <InstallmentScheduleTable
          v-else
          :schedule="schedule"
          variant="cart"
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
