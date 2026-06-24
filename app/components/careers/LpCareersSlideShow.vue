<script setup lang="ts">
defineProps<{
  images: string[]
}>()
</script>

<template>
  <StorefrontSlideShow
    :images="images"
    alt-prefix="ภาพประกอบหน้าสมัคร Lifestyle Planner"
    fit="cover"
    variant="section"
  />
</template>
