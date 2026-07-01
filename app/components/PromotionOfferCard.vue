<script setup lang="ts">
import type { PromotionProductOfferEnriched } from '~~/shared/types/promotion'
import {
  promotionGiftDisplayLabel,
  promotionOfferHasPrices,
  promotionOfferTitle,
} from '~~/shared/utils/promotionOfferDisplay'

const props = defineProps<{
  offer: PromotionProductOfferEnriched
}>()

const title = computed(() => promotionOfferTitle(props.offer, props.offer.product))
const imageUrl = computed(() => props.offer.product?.image_url?.trim() || '')
const productLink = computed(() => `/products/${props.offer.product_id}`)
const hasPrices = computed(() => promotionOfferHasPrices(props.offer))
const gifts = computed(() => props.offer.gift_items ?? [])
</script>

<template>
  <article class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <NuxtLink :to="productLink" class="block">
      <div class="relative aspect-[4/3] bg-gray-50">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="title"
          class="h-full w-full object-contain p-4"
          loading="lazy"
          decoding="async"
        >
        <div v-else class="flex h-full items-center justify-center text-gray-300">
          <Icon name="heroicons:photo" class="h-12 w-12" />
        </div>
        <span
          v-if="offer.has_gift && gifts.length"
          class="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white"
        >
          แถม {{ gifts.length }} ชิ้น
        </span>
      </div>
    </NuxtLink>

    <div class="flex flex-1 flex-col gap-4 p-4 sm:p-5">
      <div>
        <p v-if="offer.product?.sku" class="font-mono text-xs text-gray-400">{{ offer.product.sku }}</p>
        <h2 class="mt-1 text-lg font-bold text-gray-900">
          <NuxtLink :to="productLink" class="hover:text-red-600">{{ title }}</NuxtLink>
        </h2>
        <p v-if="offer.description" class="mt-2 whitespace-pre-line text-sm text-gray-600">
          {{ offer.description }}
        </p>
      </div>

      <ul
        v-if="offer.has_gift && gifts.length"
        class="space-y-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3"
      >
        <li class="text-xs font-semibold uppercase tracking-wide text-amber-800">ของแถม</li>
        <li
          v-for="(gift, index) in gifts"
          :key="`${gift.product_id}-${index}`"
          class="flex items-start gap-2 text-sm text-gray-800"
        >
          <Icon name="heroicons:gift" class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <span class="font-medium">{{ promotionGiftDisplayLabel(gift) }}</span>
            <span v-if="gift.product?.sku" class="ml-1 font-mono text-xs text-gray-500">{{ gift.product.sku }}</span>
          </span>
        </li>
      </ul>

      <div v-if="hasPrices" class="rounded-xl bg-gray-50 p-3">
        <p class="text-xs text-gray-500">ราคาตามโปรโมชั่น</p>
        <p class="mt-1 text-2xl font-bold text-red-600">
          {{ formatBaht(offer.installment_monthly) }}
          <span class="text-sm font-normal text-gray-500">/ เดือน เริ่มต้น</span>
        </p>
        <p v-if="offer.installment_total != null" class="mt-1 text-sm text-gray-700">
          รวมผ่อนทั้งสัญญา {{ formatBaht(offer.installment_total) }}
        </p>
      </div>

      <div class="mt-auto flex flex-wrap gap-2 pt-1">
        <NuxtLink
          :to="productLink"
          class="inline-flex flex-1 items-center justify-center rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
        >
          ดูรายละเอียดสินค้า
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
