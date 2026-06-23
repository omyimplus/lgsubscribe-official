<script setup lang="ts">
import { ARTICLE_SECTION_NAV } from '~~/shared/utils/articleDisplay'
import type { ArticleListItem } from '~~/shared/types/article'

import { SEO_ARTICLES } from '~~/shared/utils/siteSeoPresets'
import { buildItemListJsonLd } from '~~/shared/utils/siteSeoJsonLd'

definePageMeta({ layout: 'default' })

const route = useRoute()
const siteUrl = useSiteUrl()
const { set: setBreadcrumb } = usePageBreadcrumb()

const { data: articles } = await useFetch<ArticleListItem[]>('/api/public/articles', {
  key: 'public-articles-all',
  default: () => [],
})

const categoryQuery = computed(() => {
  const c = route.query.category
  return typeof c === 'string' ? c : ''
})

if (import.meta.server && categoryQuery.value) {
  const target = ARTICLE_SECTION_NAV.find(
    item => item.kind === 'article' && item.to.endsWith(`/${categoryQuery.value}`),
  )
  if (target) {
    await navigateTo(target.to, { redirectCode: 301 })
  }
}

onMounted(() => {
  if (!categoryQuery.value) return
  const target = ARTICLE_SECTION_NAV.find(
    item => item.kind === 'article' && item.to.endsWith(`/${categoryQuery.value}`),
  )
  if (target) navigateTo(target.to, { replace: true })
})

useSiteSeoFromPreset(SEO_ARTICLES, {
  schema: {
    pageType: 'CollectionPage',
    breadcrumbs: [
      { name: 'หน้าแรก', path: '/' },
      { name: 'บทความ' },
    ],
  },
  jsonLd: computed(() => {
    const items = (articles.value ?? []).slice(0, 30).map(article => ({
      name: article.title,
      url: `${siteUrl.value}/articles/${article.slug}`,
    }))
    return items.length ? buildItemListJsonLd(items) : undefined
  }),
})

setBreadcrumb([
  { label: 'หน้าแรก', to: '/' },
  { label: 'บทความ' },
])
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <main class="index-container py-10 sm:py-12">
      <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
        บทความจาก LG Subscribe
      </h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
        เลือกหมวดที่ต้องการอ่าน
      </p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="item in ARTICLE_SECTION_NAV"
          :key="item.to"
          :to="item.to"
          class="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-red-200 hover:shadow-md"
        >
          <p
            class="text-xs font-semibold uppercase tracking-wide"
            :class="item.kind === 'faq' ? 'text-sky-600' : 'text-[#ea1917]'"
          >
            {{ item.kind === 'faq' ? 'FAQ' : 'บทความ' }}
          </p>
          <h2 class="mt-2 text-lg font-semibold text-gray-900 group-hover:text-[#ea1917]">
            {{ item.label }}
          </h2>
          <p class="mt-2 text-sm text-gray-500">
            {{ item.kind === 'faq' ? 'คำถามที่พบบ่อยแบบแท็บ' : 'อ่านบทความในหมวดนี้' }}
          </p>
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
