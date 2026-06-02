<script setup lang="ts">
const props = defineProps<{
  show: boolean
  title: string
  message?: string
  hint?: string
}>()

function onBeforeUnload(event: BeforeUnloadEvent) {
  event.preventDefault()
  event.returnValue = ''
}

watch(
  () => props.show,
  (active) => {
    if (!import.meta.client) return
    if (active) {
      document.documentElement.classList.add('overflow-hidden')
      window.addEventListener('beforeunload', onBeforeUnload)
    }
    else {
      document.documentElement.classList.remove('overflow-hidden')
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.documentElement.classList.remove('overflow-hidden')
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      :aria-busy="true"
      :aria-label="title"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5">
        <div class="flex flex-col items-center text-center">
          <div
            class="h-12 w-12 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600"
            aria-hidden="true"
          />
          <h2 class="mt-5 text-lg font-semibold text-gray-900">
            {{ title }}
          </h2>
          <p v-if="message" class="mt-2 text-sm leading-relaxed text-gray-600">
            {{ message }}
          </p>
          <p
            v-if="hint"
            class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium leading-relaxed text-amber-900"
          >
            {{ hint }}
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
