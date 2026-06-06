<script setup lang="ts">
import { HOME_PAYMENT_BANKS } from '~~/shared/utils/paymentBanks'

const failedIds = ref<Set<string>>(new Set())

function onLogoError(id: string) {
  failedIds.value = new Set([...failedIds.value, id])
}

function showFallback(id: string) {
  return failedIds.value.has(id)
}
</script>

<template>
  <section class="border-t border-gray-200 bg-white py-8 sm:py-10">
    <div class="index-container">
      <h2 class="text-center text-sm font-semibold tracking-wide text-gray-700 sm:text-base">
        ธนาคารที่สามารถชำระได้
      </h2>

      <ul
        class="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:gap-x-9 md:gap-x-10 lg:flex-nowrap"
        aria-label="ธนาคารที่รองรับการชำระเงิน"
      >
        <li
          v-for="bank in HOME_PAYMENT_BANKS"
          :key="bank.id"
          class="flex shrink-0 items-center justify-center"
        >
          <img
            v-if="!showFallback(bank.id)"
            :src="bank.logoSrc"
            :alt="bank.label"
            class="h-11 w-auto object-contain sm:h-12 md:h-14"
            loading="lazy"
            @error="onLogoError(bank.id)"
          >
          <span
            v-else
            class="text-sm font-semibold text-gray-500"
          >
            {{ bank.label }}
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>
