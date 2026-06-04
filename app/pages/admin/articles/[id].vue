<script setup lang="ts">
import type { Article, ArticleInput } from '~~/shared/types/article'
import {
  ARTICLE_CATEGORIES,
  HOME_ARTICLE_FEATURE_LABEL,
  HOME_ARTICLES_CATEGORY,
  HOME_ARTICLES_LIMIT,
  articleCoverSrc,
} from '~~/shared/utils/articleDisplay'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const id = route.params.id as string

const { data: article, pending, error: fetchError, refresh } = await useFetch<Article>(
  () => `/api/articles/${id}`,
  { key: `article-admin-${id}` },
)

const form = reactive({
  title: '',
  slug: '',
  category: 'knowledge' as Article['category'],
  excerpt: '',
  body_html: '',
  cover_image_url: '',
  status: 'draft' as Article['status'],
  is_featured: false,
  sort_order: 0,
})

const coverDirty = ref(false)
const coverPreviewKey = ref(0)

watch(article, (a) => {
  if (!a) return
  form.title = a.title
  form.slug = a.slug
  form.category = a.category
  form.excerpt = a.excerpt ?? ''
  form.body_html = a.body_html ?? ''
  if (!coverDirty.value) {
    form.cover_image_url = a.cover_image_url ?? ''
    coverPreviewKey.value++
  }
  form.status = a.status
  form.is_featured = a.is_featured
  form.sort_order = a.sort_order
}, { immediate: true })

const saving = ref(false)
const formError = ref('')

const isPublished = computed(() => form.status === 'published')

const coverPreviewSrc = computed(() =>
  articleCoverSrc(form.cover_image_url, String(coverPreviewKey.value)),
)

const uploadingCover = ref(false)
const coverInput = ref<HTMLInputElement | null>(null)

function triggerCoverInput() {
  if (coverInput.value) coverInput.value.value = ''
  coverInput.value?.click()
}

async function handleCoverUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  uploadingCover.value = true
  formError.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('article_id', id)
    const res = await $fetch<{ url: string }>('/api/articles/upload-cover', {
      method: 'POST',
      body: formData,
    })
    form.cover_image_url = res.url
    coverDirty.value = true
    coverPreviewKey.value++
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'อัพโหลดรูปไม่สำเร็จ'
  }
  finally {
    uploadingCover.value = false
    if (coverInput.value) coverInput.value.value = ''
  }
}

function removeCover() {
  form.cover_image_url = ''
  coverDirty.value = true
  coverPreviewKey.value++
}

async function handleSave() {
  formError.value = ''
  if (!form.title.trim() || !form.slug.trim()) {
    formError.value = 'กรุณากรอกชื่อและ slug'
    return
  }

  saving.value = true
  try {
    const payload: ArticleInput = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      category: form.category,
      excerpt: form.excerpt.trim() || null,
      body_html: form.body_html || null,
      cover_image_url: form.cover_image_url.trim() || null,
      status: form.status,
      is_active: true,
      is_featured: form.category === HOME_ARTICLES_CATEGORY ? form.is_featured : false,
      sort_order: form.sort_order,
    }
    await $fetch(`/api/articles/${id}`, { method: 'PATCH', body: payload })
    coverDirty.value = false
    await refresh()
    coverPreviewKey.value++
    alert('บันทึกแล้ว')
  }
  catch (err: any) {
    formError.value = err?.data?.message ?? 'บันทึกไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!article.value) return
  if (!confirm(`ลบบทความ "${article.value.title}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/articles/${id}`, { method: 'DELETE' })
    await navigateTo('/admin/articles')
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="pending" class="py-20 text-center text-gray-400">กำลังโหลด...</div>
    <div v-else-if="fetchError || !article" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      ไม่พบบทความ
    </div>

    <template v-else>
      <AdminPageHeader
        :title="article.title"
        :description="`/articles/${article.slug}`"
      >
        <template #actions>
          <NuxtLink
            v-if="isPublished"
            :to="`/articles/${form.slug}`"
            target="_blank"
            class="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
            ดูบทความ
          </NuxtLink>
          <button
            type="button"
            class="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            :disabled="saving"
            @click="handleSave"
          >
            {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
        </template>
      </AdminPageHeader>

      <p v-if="formError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{{ formError }}</p>

      <div class="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section class="space-y-6 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อบทความ</label>
            <input v-model="form.title" type="text" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Slug</label>
            <input v-model="form.slug" type="text" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm">
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">คำโปรย (แสดงใต้หัวข้อ / การ์ด)</label>
            <textarea v-model="form.excerpt" rows="2" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">เนื้อหาบทความ</label>
            <AdminImportHtmlFieldEditor v-model="form.body_html" placeholder="เขียนเนื้อหาบทความ..." />
          </div>
        </section>

        <aside class="space-y-4">
          <section class="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
            <h2 class="text-sm font-semibold text-gray-800">รูปปกการ์ด</h2>
            <p class="mt-0.5 text-xs text-gray-500">แนะนำ 4:3 — ไม่มีรูปจะใช้กราฟิก brand</p>
            <div class="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <img
                v-if="form.cover_image_url"
                :src="coverPreviewSrc"
                alt=""
                class="size-full object-cover"
              >
              <div v-else class="flex size-full items-center justify-center text-gray-300">
                <Icon name="heroicons:photo" class="h-10 w-10" />
              </div>
              <div
                v-if="uploadingCover"
                class="absolute inset-0 flex items-center justify-center bg-white/80"
              >
                <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-red-500" />
              </div>
            </div>
            <input
              ref="coverInput"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="hidden"
              @change="handleCoverUpload"
            >
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                :disabled="uploadingCover"
                @click="triggerCoverInput"
              >
                อัพโหลดรูป
              </button>
              <button
                v-if="form.cover_image_url"
                type="button"
                class="text-xs text-red-500 hover:underline"
                @click="removeCover"
              >
                ลบรูป
              </button>
            </div>
          </section>

          <section class="space-y-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">หมวด</label>
              <select v-model="form.category" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
                <option v-for="c in ARTICLE_CATEGORIES" :key="c.slug" :value="c.slug">
                  {{ c.label }}
                </option>
              </select>
            </div>
            <label
              v-if="form.category === HOME_ARTICLES_CATEGORY"
              class="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-3"
            >
              <input
                v-model="form.is_featured"
                type="checkbox"
                class="mt-0.5 size-4 rounded border-gray-300 text-[#ea1917] focus:ring-[#ea1917]"
              >
              <span class="text-sm text-gray-800">
                <span class="font-medium">{{ HOME_ARTICLE_FEATURE_LABEL }}</span>
                <span class="mt-0.5 block text-xs text-gray-600">
                  หน้าแรกแสดงได้สูงสุด {{ HOME_ARTICLES_LIMIT }} ชิ้น — เรียงตามลำดับด้านล่าง (เลขน้อยขึ้นก่อน)
                </span>
              </span>
            </label>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">ลำดับบนหน้าแรก</label>
              <input v-model.number="form.sort_order" type="number" min="0" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
              <p class="mt-1 text-xs text-gray-500">
                ใช้เมื่อติ๊ก «{{ HOME_ARTICLE_FEATURE_LABEL }}» — หน้ารายการสาระน่ารู้ไม่ขึ้นกับค่านี้
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">สถานะ</label>
              <select v-model="form.status" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
                <option value="draft">แบบร่าง — ลูกค้ายังไม่เห็น</option>
                <option value="published">เผยแพร่ — แสดงบนเว็บ</option>
              </select>
            </div>
          </section>

          <button
            type="button"
            class="w-full rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            @click="handleDelete"
          >
            ลบบทความ
          </button>
        </aside>
      </div>
    </template>
  </div>
</template>
