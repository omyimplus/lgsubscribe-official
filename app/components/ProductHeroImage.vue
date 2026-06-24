<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import {
  productGalleryUrls,
  productImageReferrerPolicy,
} from '~~/shared/utils/productHeroImage'

const props = defineProps<{
  product: Product
  /** รูปที่ผู้ใช้เลือกจากแกลเลอรี — ว่าง = ใช้ลำดับ fallback อัตโนมัติ */
  selectedUrl?: string | null
}>()

const failedUrls = ref<string[]>([])

const galleryUrls = computed(() => productGalleryUrls(props.product))

watch(
  () => [props.product.id, props.selectedUrl, galleryUrls.value.join('|')] as const,
  () => { failedUrls.value = [] },
)

const heroSrc = computed(() => {
  const failed = new Set(failedUrls.value)
  const preferred = props.selectedUrl?.trim()
  if (preferred && !failed.has(preferred)) return preferred
  return galleryUrls.value.find(url => !failed.has(url)) ?? ''
})

const referrerPolicy = computed(() =>
  heroSrc.value ? productImageReferrerPolicy(heroSrc.value) : undefined,
)

function onError() {
  const src = heroSrc.value
  if (!src || failedUrls.value.includes(src)) return
  failedUrls.value = [...failedUrls.value, src]
}
</script>

<template>
  <div
    class="relative mx-auto flex aspect-square w-full max-h-[28rem] items-center justify-center overflow-hidden bg-white"
  >
    <Transition
      v-if="heroSrc"
      mode="out-in"
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <img
        :key="heroSrc"
        :src="heroSrc"
        class="absolute inset-0 m-auto max-h-full max-w-full object-contain"
        :alt="product.name"
        width="640"
        height="640"
        fetchpriority="high"
        loading="eager"
        decoding="async"
        :referrerpolicy="referrerPolicy"
        @error="onError"
      >
    </Transition>
    <div
      v-else
      class="flex size-full items-center justify-center text-gray-400"
    >
      <Icon name="heroicons:photo" class="h-16 w-16" />
    </div>
  </div>
</template>
