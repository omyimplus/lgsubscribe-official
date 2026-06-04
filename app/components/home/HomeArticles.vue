<script setup lang="ts">
import type { ArticleListItem } from '~~/shared/types/article'
import ArticleCard from '~/components/article/ArticleCard.vue'
import { ARTICLE_CATEGORIES, HOME_ARTICLES_CATEGORY } from '~~/shared/utils/articleDisplay'

const homeCategoryLabel = ARTICLE_CATEGORIES.find(c => c.slug === HOME_ARTICLES_CATEGORY)?.label ?? 'สาระน่ารู้'

const { data: articles, pending } = await useFetch<ArticleListItem[]>('/api/public/articles/featured', {
  key: 'public-home-articles-featured',
  default: () => [],
})
</script>

<template>
  <section class="bg-gray-50 py-10 sm:py-12">
    <div class="index-container">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 class="text-xl font-bold text-gray-900 sm:text-2xl">
          {{ homeCategoryLabel }}
        </h2>
        <NuxtLink
          :to="`/articles/${HOME_ARTICLES_CATEGORY}`"
          class="text-sm font-medium text-[#ea1917] hover:underline"
        >
          ดูบทความทั้งหมด
        </NuxtLink>
      </div>

      <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="i in 4"
          :key="i"
          class="h-64 animate-pulse rounded-2xl bg-gray-200"
        />
      </div>

      <div
        v-else-if="!(articles?.length)"
        class="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-500"
      >
        ยังไม่มีบทความบนหน้าแรก — ในหลังบ้านเลือกหมวดสาระน่ารู้ ตั้ง «เผยแพร่» แล้วติ๊ก
        «แสดงบนหน้าแรก» (สูงสุด 4)
        <NuxtLink to="/admin/articles" class="font-medium text-[#ea1917] hover:underline">
          ไปจัดการบทความ
        </NuxtLink>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ArticleCard
          v-for="item in articles"
          :key="item.id"
          :article="item"
          home-style
        />
      </div>
    </div>
  </section>
</template>
