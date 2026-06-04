<script setup lang="ts">
import type { ArticleListItem } from '~~/shared/types/article'
import { articleCategoryLabel, articleCoverSrc } from '~~/shared/utils/articleDisplay'

defineProps<{
  article: ArticleListItem
  /** การ์ดหน้าแรก — กราฟิก fallback แบบ brand */
  homeStyle?: boolean
}>()
</script>

<template>
  <NuxtLink
    :to="`/articles/${article.slug}`"
    class="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
  >
    <div
      v-if="article.cover_image_url"
      class="relative aspect-[4/3] overflow-hidden bg-gray-100"
    >
      <img
        :src="articleCoverSrc(article.cover_image_url, article.updated_at)"
        :alt="article.title"
        class="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.02]"
        loading="lazy"
      >
    </div>
    <div
      v-else
      class="flex aspect-[4/3] flex-col items-center justify-center bg-gradient-to-br from-red-600 via-[#ea1917] to-orange-500 px-4 text-center text-white"
      :class="homeStyle ? '' : 'from-red-500 via-[#ea1917] to-amber-500'"
    >
      <p class="text-2xl font-bold leading-tight sm:text-3xl">
        เพียงแค่
      </p>
      <p class="text-3xl font-black tracking-tight sm:text-4xl">
        ซับ
      </p>
      <p class="mt-2 text-sm font-medium text-white/90">
        ก็ใช้สินค้า LG ได้
      </p>
    </div>
    <div class="p-4">
      <p
        v-if="!homeStyle"
        class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400"
      >
        {{ articleCategoryLabel(article.category) }}
      </p>
      <h3 class="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-[#ea1917]">
        {{ article.title }}
      </h3>
      <p v-if="article.excerpt" class="mt-1 line-clamp-2 text-xs text-gray-600">
        {{ article.excerpt }}
      </p>
    </div>
  </NuxtLink>
</template>
