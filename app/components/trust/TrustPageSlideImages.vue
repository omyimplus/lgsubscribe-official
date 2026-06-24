<script setup lang="ts">
defineProps<{
  images: string[]
}>()
</script>

<template>
  <StorefrontSlideShow
    :images="images"
    alt-prefix="ภาพความน่าเชื่อถือ"
    fit="contain"
    variant="inline"
  />
</template>
