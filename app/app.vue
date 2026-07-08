<script setup lang="ts">
const gtmId = computed(() => String(useRuntimeConfig().public.gtmId ?? '').trim())
const route = useRoute()
const showGtm = computed(() => {
  const path = route.path
  const isAdmin = path === '/admin' || path.startsWith('/admin/')
  return Boolean(gtmId.value) && !isAdmin
})
</script>

<template>
  <noscript v-if="showGtm">
    <iframe
      :src="`https://www.googletagmanager.com/ns.html?id=${gtmId}`"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
    />
  </noscript>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
