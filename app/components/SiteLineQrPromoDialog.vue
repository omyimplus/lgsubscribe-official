<script setup lang="ts">
import { LINE_QR_IMAGE_PATH } from '~~/shared/utils/lineQrPromo'

const { lineOaUrl, lineOaIdDisplay } = useLineOa()
const { open, dismiss } = useLineQrPromoDialog()
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="open"
          class="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="line-qr-promo-title"
          @click.self="dismiss"
        >
          <Transition
            appear
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-[0.96]"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-[0.96]"
          >
            <div
              v-if="open"
              class="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
              @click.stop
            >
              <button
                type="button"
                class="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition hover:bg-white hover:text-gray-900"
                aria-label="ปิด"
                @click="dismiss"
              >
                <Icon name="heroicons:x-mark" class="h-5 w-5" />
              </button>

              <div class="px-6 pb-6 pt-8 text-center">
                <h2 id="line-qr-promo-title" class="text-lg font-bold text-gray-900 sm:text-xl">
                  เพิ่มเพื่อน Line Official
                </h2>
                <p v-if="lineOaIdDisplay" class="mt-1 text-sm text-gray-500">
                  {{ lineOaIdDisplay }}
                </p>

                <div class="mx-auto mt-5 max-w-[240px] overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <img
                    :src="LINE_QR_IMAGE_PATH"
                    alt="QR Code เพิ่มเพื่อน Line Official"
                    class="mx-auto block w-full rounded-lg"
                    width="240"
                    height="240"
                  >
                </div>

                <a
                  v-if="lineOaUrl"
                  :href="lineOaUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#06C755] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#05b34c]"
                >
                  เปิด Line เพื่อเพิ่มเพื่อน
                </a>

                <button
                  type="button"
                  class="mt-3 w-full text-sm text-gray-500 transition hover:text-gray-700"
                  @click="dismiss"
                >
                  ปิด
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
