<script setup lang="ts">
const route = useRoute()

/** Hero ทุกหน้าร้าน ยกเว้น contact (หรือ meta.showHero === false) */
const showHero = computed(() => {
  if (route.meta.showHero === false) return false
  const path = route.path
  return path !== '/contact' && !path.startsWith('/contact/')
})
</script>

<template>
  <div class="storefront min-h-screen bg-gray-50">
    <SiteHeader />
    <HomeHero v-if="showHero" />
    <slot />
    <SiteFooter />
    <InterestCartPanel />
    <CustomerAuthDialog />
    <SiteLineQrPromoDialog />
  </div>
</template>
