<script setup lang="ts">
import ArticlesCategoryView from '~/components/ArticlesCategoryView.vue'
import { HOME_ARTICLES_CATEGORY } from '~~/shared/utils/articleDisplay'

definePageMeta({ layout: 'default' })
</script>

<template>
  <ArticlesCategoryView :category="HOME_ARTICLES_CATEGORY" home-style />
</template>
