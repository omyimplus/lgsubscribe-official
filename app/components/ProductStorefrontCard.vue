<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import {
  type ProductDisplayGroup,
  variantStorefrontTitle,
} from '~~/shared/utils/productGroupDisplay'
import type { Tag } from '~~/shared/types/tag'
import { HOME_FEATURED_TAG_LABEL, isHomeFeaturedTag } from '~~/shared/utils/homeFeatured'

type TagChip = Pick<Tag, 'id' | 'name' | 'slug' | 'color'>
const props = withDefaults(defineProps<{
  group: ProductDisplayGroup
  /** ป้าย «แนะนำ» บนหน้าแรก (แท็ก admin: สินค้าแนะนำ / home-featured) */
  showHomeFeaturedBadge?: boolean
}>(), {
  showHomeFeaturedBadge: false,
})

const emit = defineEmits<{
  addedToCart: [product: Product]
}>()

const selectedIndex = ref(0)
const scheduleOpen = ref(false)
const planDialogOpen = ref(false)
const installmentDialogRef = ref<{ present: () => Promise<void> } | null>(null)

const selected = computed(() => props.group.variants[selectedIndex.value] ?? props.group.variants[0]!)
const hasMultipleVariants = computed(() => props.group.variants.length > 1)
const displayTitle = computed(() => variantStorefrontTitle(selected.value))
const displayHeadline = computed(() => selected.value.headline?.trim() || '')
const hasPlans = computed(() => (selected.value.plans?.length ?? 0) > 0)

const displayTags = computed((): TagChip[] => {
  const tags = (selected.value.tags ?? []) as TagChip[]
  return [...tags].sort((a, b) => {
    const aHome = isHomeFeaturedTag(a) ? 0 : 1
    const bHome = isHomeFeaturedTag(b) ? 0 : 1
    if (aHome !== bHome) return aHome - bHome
    return a.name.localeCompare(b.name, 'th')
  })
})

function tagChipLabel(tag: TagChip) {
  if (props.showHomeFeaturedBadge && isHomeFeaturedTag(tag)) {
    return HOME_FEATURED_TAG_LABEL
  }
  return tag.name
}

function tagChipColor(tag: TagChip) {
  return tag.color?.trim() || '#6b7280'
}

function swatchLabel(v: Product) {
  const label = v.variant_label?.trim()
  if (label) return label.replace(/\s*inch\s*/i, '"').replace(/\s*นิ้ว\s*/i, '"')
  const m = v.name.match(/(\d+)\s*"/)
  return m ? `${m[1]}"` : v.sku
}

function openSchedule() {
  scheduleOpen.value = true
}

async function openPlanDialog() {
  if (!hasPlans.value) return
  planDialogOpen.value = true
  await nextTick()
  await installmentDialogRef.value?.present()
}

async function openSelectProduct() {
  await openPlanDialog()
}

function onAddedToCart() {
  emit('addedToCart', selected.value)
}

watch(
  () => props.group.variants.map(v => v.id).join(','),
  () => { selectedIndex.value = 0 },
)
</script>

<template>
  <article class="product-storefront-card flex h-full flex-col">
    <div class="mb-3 flex min-h-[1.375rem] flex-wrap items-center gap-1.5">
      <span
        v-for="tag in displayTags"
        :key="tag.id"
        class="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold leading-none text-white"
        :style="{ backgroundColor: tagChipColor(tag) }"
      >
        {{ tagChipLabel(tag) }}
      </span>
      <button
        v-for="(v, i) in group.variants"
        v-show="hasMultipleVariants"
        :key="v.id"
        type="button"
        class="inline-flex min-w-[2.25rem] items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold leading-none transition"
        :class="i === selectedIndex
          ? 'bg-[#ea1917] text-white'
          : 'border border-[#ea1917] bg-white text-[#ea1917] hover:bg-red-50'"
        :title="v.name"
        @click="selectedIndex = i"
      >
        {{ swatchLabel(v) }}
      </button>
    </div>

    <NuxtLink
      :to="`/products/${selected.id}`"
      class="product-storefront-card__image"
    >
      <img
        v-if="selected.image_url"
        :src="selected.image_url"
        :alt="selected.name"
        loading="lazy"
      >
      <div v-else class="flex h-[11.5rem] w-full items-center justify-center bg-gray-50">
        <Icon name="heroicons:photo" class="h-12 w-12 text-gray-300" />
      </div>
    </NuxtLink>

    <div class="mb-4 flex min-h-0 flex-1 flex-col">
      <NuxtLink
        :to="`/products/${selected.id}`"
        class="line-clamp-2 text-sm font-normal leading-snug text-gray-900 hover:text-[#ea1917]"
      >
        {{ displayTitle }}
      </NuxtLink>
      <p
        v-if="displayHeadline"
        class="mt-1.5 line-clamp-2 text-sm font-normal leading-snug text-gray-600"
        :title="displayHeadline"
      >
        {{ displayHeadline }}
      </p>
    </div>

    <div class="mt-auto flex shrink-0 gap-2">
      <template v-if="hasPlans">
        <button
          type="button"
          class="product-storefront-card__btn-outline flex-1"
          @click.prevent="openSchedule"
        >
          แผนการชำระ
        </button>

        <button
          type="button"
          class="product-storefront-card__btn-primary flex-1"
          @click.prevent="openSelectProduct"
        >
          เลือกสินค้า
        </button>
      </template>

      <NuxtLink
        v-else
        :to="`/products/${selected.id}`"
        class="product-storefront-card__btn-primary w-full text-center"
      >
        ดูรายละเอียดสินค้า
      </NuxtLink>
    </div>

    <ClientOnly v-if="hasPlans">
      <ProductInstallmentDialog
        ref="installmentDialogRef"
        :open="planDialogOpen"
        :product="selected"
        @update:open="planDialogOpen = $event"
        @added="onAddedToCart"
      />
      <ProductInstallmentScheduleDialog
        :open="scheduleOpen"
        :product="selected"
        @update:open="scheduleOpen = $event"
      />
    </ClientOnly>
  </article>
</template>
