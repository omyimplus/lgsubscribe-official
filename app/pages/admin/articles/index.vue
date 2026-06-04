<script setup lang="ts">
import type { Article, ArticleInput } from '~~/shared/types/article'
import {
  ARTICLE_CATEGORIES,
  HOME_ARTICLE_FEATURE_LABEL,
  HOME_ARTICLES_CATEGORY,
  articleCategoryLabel,
} from '~~/shared/utils/articleDisplay'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: articles, pending, error: fetchError, refresh } = await useFetch<Article[]>('/api/articles', {
  default: () => [],
})

const search = ref('')
const categoryFilter = ref('')

const filtered = computed(() => {
  let list = articles.value ?? []
  const cat = categoryFilter.value
  if (cat) list = list.filter(a => a.category === cat)
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(a =>
    a.title.toLowerCase().includes(q)
    || a.slug.toLowerCase().includes(q),
  )
})

const stats = computed(() => {
  const list = articles.value ?? []
  return {
    total: list.length,
    published: list.filter(a => a.status === 'published').length,
    draft: list.filter(a => a.status === 'draft').length,
  }
})

const dialogOpen = ref(false)
const saving = ref(false)
const formError = ref('')
const form = reactive<ArticleInput>({
  title: '',
  slug: '',
  category: 'knowledge',
  status: 'draft',
})

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

watch(() => form.title, (title) => {
  form.slug = slugify(title)
})

function openCreate() {
  form.title = ''
  form.slug = ''
  form.category = 'knowledge'
  form.status = 'draft'
  formError.value = ''
  dialogOpen.value = true
}

async function handleCreate() {
  formError.value = ''
  if (!form.title.trim() || !form.slug.trim()) {
    formError.value = 'กรุณากรอกชื่อและ slug'
    return
  }

  saving.value = true
  try {
    const created = await $fetch<Article>('/api/articles', {
      method: 'POST',
      body: {
        title: form.title.trim(),
        slug: form.slug.trim(),
        category: form.category,
        status: 'draft',
      },
    })
    dialogOpen.value = false
    await navigateTo(`/admin/articles/${created.id}`)
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'สร้างบทความไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}

async function handleDelete(a: Article) {
  if (!confirm(`ลบบทความ "${a.title}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/articles/${a.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}

function statusLabel(a: Article) {
  return a.status === 'published' ? 'เผยแพร่' : 'แบบร่าง'
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="บทความ"
      description="หน้าแรก: ติ๊ก «แสดงบนหน้าแรก» ในหมวดสาระน่ารู้ (สูงสุด 4) · หน้ารายการสาระน่ารู้: บทความที่เผยแพร่ทั้งหมด"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
          @click="openCreate"
        >
          <Icon name="heroicons:plus" class="h-4 w-4" />
          สร้างบทความ
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">ทั้งหมด</p>
        <p class="mt-1 text-2xl font-bold">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">เผยแพร่</p>
        <p class="mt-1 text-2xl font-bold text-emerald-700">{{ stats.published }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-400">แบบร่าง</p>
        <p class="mt-1 text-2xl font-bold text-gray-500">{{ stats.draft }}</p>
      </div>
    </div>

    <section class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div class="flex flex-wrap gap-3 border-b border-gray-100 p-4">
        <div class="relative min-w-[12rem] flex-1 max-w-xs">
          <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            v-model="search"
            type="search"
            placeholder="ค้นหาชื่อ / slug..."
            class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
          >
        </div>
        <select
          v-model="categoryFilter"
          class="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">ทุกหมวด</option>
          <option v-for="c in ARTICLE_CATEGORIES" :key="c.slug" :value="c.slug">
            {{ c.label }}
          </option>
        </select>
      </div>

      <div v-if="fetchError" class="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ fetchError.message }}
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm">
          <thead>
            <tr class="border-b bg-gray-50/80 text-left text-xs font-semibold uppercase text-gray-500">
              <th class="px-4 py-3">บทความ</th>
              <th class="px-4 py-3">หมวด</th>
              <th class="px-4 py-3">สถานะ</th>
              <th class="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending">
              <td colspan="4" class="py-16 text-center text-gray-400">กำลังโหลด...</td>
            </tr>
            <tr v-else-if="!filtered.length">
              <td colspan="4" class="py-16 text-center text-gray-500">ยังไม่มีบทความ</td>
            </tr>
            <tr v-for="a in filtered" v-else :key="a.id" class="hover:bg-gray-50/80">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ a.title }}</p>
                <p class="mt-0.5 font-mono text-xs text-gray-500">/articles/{{ a.slug }}</p>
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ articleCategoryLabel(a.category) }}
                <span
                  v-if="a.category === HOME_ARTICLES_CATEGORY && a.is_featured"
                  class="ml-1 inline-flex rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800"
                >{{ HOME_ARTICLE_FEATURE_LABEL }}</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="a.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-600'"
                >
                  {{ statusLabel(a) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <NuxtLink
                    v-if="a.status === 'published'"
                    :to="`/articles/${a.slug}`"
                    target="_blank"
                    class="inline-flex rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-emerald-700"
                    title="ดูบทความบนเว็บ"
                  >
                    <Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
                  </NuxtLink>
                  <NuxtLink
                    :to="`/admin/articles/${a.id}`"
                    class="inline-flex rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                    title="แก้ไข"
                  >
                    <Icon name="heroicons:pencil-square" class="h-4 w-4" />
                  </NuxtLink>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    @click="handleDelete(a)"
                  >
                    <Icon name="heroicons:trash" class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
      v-if="dialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="dialogOpen = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-gray-900">สร้างบทความ</h2>
        <form class="mt-4 space-y-4" @submit.prevent="handleCreate">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อบทความ</label>
            <input v-model="form.title" type="text" required class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Slug</label>
            <input v-model="form.slug" type="text" required class="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm">
            <p class="mt-1 text-xs text-gray-500">/articles/{{ form.slug || '...' }}</p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">หมวด</label>
            <select v-model="form.category" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
              <option v-for="c in ARTICLE_CATEGORIES" :key="c.slug" :value="c.slug">
                {{ c.label }}
              </option>
            </select>
          </div>
          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" @click="dialogOpen = false">
              ยกเลิก
            </button>
            <button
              type="submit"
              class="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? 'กำลังสร้าง...' : 'สร้างและแก้ไข' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
