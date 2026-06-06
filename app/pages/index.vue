<script setup lang="ts">
import type { HomeCategoryCard } from '~~/shared/types/homeCategory'
import type { Product } from '~~/shared/types/product'
import type { Promotion } from '~~/shared/types/promotion'
import { groupProducts } from '~~/shared/utils/productGroupDisplay'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'LG Subscribe — เป็นเจ้าของ LG ง่ายกว่าใคร',
  description: 'เริ่มต้นเพียงหลักร้อย จ่ายง่ายผ่อนสบาย สมัครใช้เครื่องใช้ไฟฟ้า LG แบบรายเดือน',
})

const HOME_CATEGORIES_KEY = 'public-home-categories'
const HOME_PROMOTIONS_KEY = 'public-home-promotions'
const HOME_FEATURED_KEY = 'public-home-featured-products'

const { data: homeCategories, pending: homeCategoriesPending } = await useFetch<HomeCategoryCard[]>('/api/public/home-categories', {
  key: HOME_CATEGORIES_KEY,
  default: () => [],
})

type PromotionRow = Promotion & { product_count: number }

const { data: promotions, pending: promotionsPending } = await useFetch<PromotionRow[]>('/api/public/promotions', {
  key: HOME_PROMOTIONS_KEY,
  default: () => [],
})

const { data: featuredProducts, pending: featuredPending, refresh: refreshFeaturedProducts } = await useFetch<Product[]>('/api/public/featured-products', {
  key: HOME_FEATURED_KEY,
  default: () => [],
})

const route = useRoute()

/** กลับมาหน้าแรก (รวมปุ่ม Back) — รีเฟรชสินค้าแนะนำถ้า cache ว่าง */
onMounted(() => {
  if (route.path === '/' && !(featuredProducts.value?.length)) {
    refreshFeaturedProducts()
  }
})

onActivated(() => {
  if (route.path === '/' && !(featuredProducts.value?.length)) {
    refreshFeaturedProducts()
  }
})

const featuredGroups = computed(() => groupProducts(featuredProducts.value ?? []))
</script>

<template>
  <main>
    <HomeCategorySlider
      :items="homeCategories ?? []"
      :loading="homeCategoriesPending"
    />
    <HomeBannerPair />
    <HomeYoutubeVideo />
    <HomePromotions
      :promotions="promotions ?? []"
      :loading="promotionsPending"
    />
    <HomeFeaturedProducts
      :groups="featuredGroups"
      :loading="featuredPending"
    />
    <HomeArticles />
    <HomeExperiences />
    <HomePaymentBanks />
  </main>
</template>
