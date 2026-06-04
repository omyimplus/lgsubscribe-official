<script setup lang="ts">
import type { ArticleCategory, ArticleListItem } from '~~/shared/types/article'
import ArticleCard from '~/components/article/ArticleCard.vue'
import {
  HOME_ARTICLES_CATEGORY,
  articleCategoryLabel,
} from '~~/shared/utils/articleDisplay'

const props = withDefaults(defineProps<{
  category: ArticleCategory
  /** เลย์เอาต์การ์ดแบบ section หน้าแรก (สาระน่ารู้) */
  homeStyle?: boolean
}>(), {
  homeStyle: false,
})

const { set: setBreadcrumb } = usePageBreadcrumb()
const categoryLabel = computed(() => articleCategoryLabel(props.category))
const useHomeLayout = computed(() =>
  props.homeStyle || props.category === HOME_ARTICLES_CATEGORY,
)

const { data: articles, pending, error } = await useFetch<ArticleListItem[]>('/api/public/articles', {
  query: computed(() => ({ category: props.category })),
  key: computed(() => `public-articles-${props.category}`),
  default: () => [],
})

const errorMessage = computed(() => {
  const err = error.value as { data?: { message?: string }, message?: string } | null
  return err?.data?.message ?? err?.message ?? 'โหลดบทความไม่สำเร็จ'
})

useSeoMeta({
  title: () => `${categoryLabel.value} — LG Subscribe`,
  description: () => `บทความหมวด${categoryLabel.value} จาก LG Subscribe`,
})

watch(
  categoryLabel,
  (label) => {
    setBreadcrumb([
      { label: 'หน้าแรก', to: '/' },
      { label: 'บทความ', to: '/articles' },
      { label },
    ])
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <main class="index-container py-10 sm:py-12">
      <h1
        class="font-bold text-gray-900"
        :class="useHomeLayout ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'"
      >
        {{ categoryLabel }}
      </h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
        <template v-if="useHomeLayout">
          บทความที่เผยแพร่ในหมวดนี้ทั้งหมด — เลือกจากการ์ดด้านล่าง (ไม่จำกัดแค่ที่ขึ้นหน้าแรก)
        </template>
        <template v-else>
          เลือกบทความจากการ์ดด้านล่าง
        </template>
      </p>

      <div v-if="pending" class="mt-8 grid gap-4 sm:grid-cols-2" :class="useHomeLayout ? 'lg:grid-cols-4' : 'lg:grid-cols-3'">
        <div
          v-for="i in (useHomeLayout ? 4 : 6)"
          :key="i"
          class="h-64 animate-pulse rounded-2xl bg-gray-200"
        />
      </div>
      <div v-else-if="error" class="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ errorMessage }}
        <p class="mt-2 text-xs text-red-500/90">
          ถ้าเพิ่งเพิ่มระบบบทความ ให้รัน migration <code class="rounded bg-red-100 px-1">0033_articles.sql</code> บน Supabase
        </p>
      </div>
      <div
        v-else-if="!(articles?.length)"
        class="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-500"
      >
        <template v-if="useHomeLayout">
          ยังไม่มีบทความที่เผยแพร่ในหมวดสาระน่ารู้ — สร้างจาก
          <NuxtLink to="/admin/articles" class="font-medium text-[#ea1917] hover:underline">
            หลังบ้านบทความ
          </NuxtLink>
          (หมวด «สาระน่ารู้» + สถานะ «เผยแพร่»)
        </template>
        <template v-else>
          ยังไม่มีบทความในหมวดนี้
        </template>
      </div>
      <div
        v-else
        class="mt-8 grid gap-4 sm:grid-cols-2"
        :class="useHomeLayout ? 'lg:grid-cols-4' : 'lg:grid-cols-3'"
      >
        <ArticleCard
          v-for="a in articles"
          :key="a.id"
          :article="a"
          :home-style="useHomeLayout"
        />
      </div>
    </main>
  </div>
</template>
