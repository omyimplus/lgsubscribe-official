<script setup lang="ts">
import type { Article } from '~~/shared/types/article'
import {
  articleCategoryLabel,
  articleCategoryPath,
  articleCoverSrc,
  isArticleCategorySlug,
} from '~~/shared/utils/articleDisplay'

definePageMeta({ layout: 'default' })

const route = useRoute()
const slug = route.params.slug as string

/** หมวดบทความมีหน้าเฉพาะ (เช่น /articles/knowledge) */
if (isArticleCategorySlug(slug)) {
  await navigateTo(articleCategoryPath(slug), { redirectCode: 301 })
}

const { set: setBreadcrumb } = usePageBreadcrumb()
const bodyRef = ref<HTMLElement | null>(null)

const { data: article, pending, error } = await useFetch<Article>(
  () => `/api/public/articles/${slug}`,
  { key: `article-public-${slug}` },
)

useEmbeddedVideos(bodyRef, () => article.value?.body_html)

useSeoMeta({
  title: () => article.value?.title ? `${article.value.title} — LG Subscribe` : 'บทความ — LG Subscribe',
  description: () => article.value?.excerpt ?? undefined,
})

watch(
  () => article.value,
  (a) => {
    if (!a) return
    setBreadcrumb([
      { label: 'หน้าแรก', to: '/' },
      { label: 'บทความ', to: '/articles' },
      { label: articleCategoryLabel(a.category), to: articleCategoryPath(a.category) },
      { label: a.title },
    ])
  },
  { immediate: true },
)

const coverSrc = computed(() =>
  article.value?.cover_image_url
    ? articleCoverSrc(article.value.cover_image_url, article.value.updated_at)
    : '',
)
</script>

<template>
  <div class="min-h-screen bg-white">
    <main class="index-container py-8 sm:py-12">
      <div v-if="pending" class="py-20 text-center text-gray-400">กำลังโหลด...</div>
      <div v-else-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">ไม่พบบทความ</div>

      <article v-else-if="article">
        <p class="text-xs font-semibold uppercase tracking-wide text-[#ea1917]">
          {{ articleCategoryLabel(article.category) }}
        </p>
        <h1 class="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          {{ article.title }}
        </h1>
        <p v-if="article.excerpt" class="mt-3 max-w-3xl text-base text-gray-600">
          {{ article.excerpt }}
        </p>
        <p
          v-if="article.published_at"
          class="mt-2 text-sm text-gray-400"
        >
          {{ new Date(article.published_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) }}
        </p>

        <div v-if="coverSrc" class="mt-8 overflow-hidden rounded-2xl">
          <img
            :src="coverSrc"
            :alt="article.title"
            class="max-h-80 w-full object-cover"
          >
        </div>

        <div
          v-if="article.body_html"
          ref="bodyRef"
          class="article-body storefront-rich-html prose prose-sm mt-8 max-w-none text-gray-700 sm:prose-base"
          v-html="article.body_html"
        />
        <p v-else class="mt-8 text-gray-500">ยังไม่มีเนื้อหาบทความ</p>

        <div class="mt-10 border-t border-gray-100 pt-6">
          <NuxtLink
            :to="articleCategoryPath(article.category)"
            class="inline-flex items-center gap-1 text-sm font-medium text-[#ea1917] hover:underline"
          >
            <Icon name="heroicons:arrow-left" class="h-4 w-4" />
            กลับรายการบทความ
          </NuxtLink>
        </div>
      </article>
    </main>
  </div>
</template>
