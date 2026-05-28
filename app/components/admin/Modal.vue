<script setup lang="ts">
const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'max-w-sm'
    case 'lg': return 'max-w-2xl'
    case 'xl': return 'max-w-4xl'
    default: return 'max-w-lg'
  }
})

watch(open, (isOpen) => {
  const el = dialogRef.value
  if (!el) return
  if (isOpen && !el.open) el.showModal()
  else if (!isOpen && el.open) el.close()
})

function close() {
  open.value = false
}

function onDialogClose() {
  open.value = false
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === dialogRef.value) close()
}

onMounted(() => {
  if (open.value) dialogRef.value?.showModal()
})

onBeforeUnmount(() => {
  dialogRef.value?.close()
})
</script>

<template>
  <dialog
    ref="dialogRef"
    :class="[
      'w-[calc(100%-2rem)] rounded-2xl border-0 bg-white p-0 shadow-2xl',
      'backdrop:bg-black/50 backdrop:backdrop-blur-sm',
      sizeClass,
    ]"
    @close="onDialogClose"
    @click="onBackdropClick"
  >
    <div class="flex max-h-[min(90vh,720px)] flex-col" @click.stop>
      <div class="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 class="text-base font-semibold text-gray-900">
          {{ title }}
        </h3>
        <button
          type="button"
          class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="ปิด"
          @click="close"
        >
          <Icon name="heroicons:x-mark" class="h-5 w-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <slot />
      </div>

      <div
        v-if="$slots.footer"
        class="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4"
      >
        <slot name="footer" />
      </div>
    </div>
  </dialog>
</template>

<style scoped>
dialog::backdrop {
  background: rgb(0 0 0 / 0.45);
  backdrop-filter: blur(2px);
}
</style>
