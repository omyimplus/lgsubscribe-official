<script setup lang="ts">
import type { FaqItem, FaqItemInput } from '~~/shared/types/faqItem'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const id = route.params.id as string

const { data: item, pending, error: fetchError, refresh } = await useFetch<FaqItem>(
  () => `/api/faq-items/${id}`,
  { key: `faq-admin-${id}` },
)

const form = reactive({
  tab_title: '',
  body_html: '',
  sort_order: 0,
  is_active: true,
})

watch(item, (row) => {
  if (!row) return
  form.tab_title = row.tab_title
  form.body_html = row.body_html ?? ''
  form.sort_order = row.sort_order
  form.is_active = row.is_active
}, { immediate: true })

const saving = ref(false)
const formError = ref('')
const bodyRef = ref<HTMLElement | null>(null)

async function handleSave() {
  formError.value = ''
  if (!form.tab_title.trim()) {
    formError.value = 'กรุณาระบุชื่อแท็บ'
    return
  }

  saving.value = true
  try {
    const payload: FaqItemInput = {
      tab_title: form.tab_title.trim(),
      body_html: form.body_html || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    }
    await $fetch(`/api/faq-items/${id}`, { method: 'PATCH', body: payload })
    await refresh()
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
  if (!item.value) return
  if (!confirm(`ลบแท็บ "${item.value.tab_title}" ใช่หรือไม่?`)) return
  try {
    await $fetch(`/api/faq-items/${id}`, { method: 'DELETE' })
    await navigateTo('/admin/faq')
  }
  catch (err: any) {
    alert(err?.data?.message ?? 'ลบไม่สำเร็จ')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="pending" class="py-20 text-center text-gray-400">กำลังโหลด...</div>
    <div v-else-if="fetchError || !item" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      ไม่พบแท็บ FAQ
    </div>

    <template v-else>
      <AdminPageHeader
        :title="item.tab_title"
        description="แก้ไขเนื้อหาในแท็บนี้"
      >
        <template #actions>
          <NuxtLink
            to="/admin/faq"
            class="rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            กลับรายการ
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

      <div class="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section class="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อแท็บ</label>
            <input v-model="form.tab_title" type="text" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">เนื้อหาในแท็บ</label>
            <AdminImportHtmlFieldEditor v-model="form.body_html" placeholder="คำถาม-คำตอบ หรือเนื้อหา FAQ..." />
          </div>
          <div v-if="form.body_html" class="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <p class="mb-2 text-xs font-semibold uppercase text-gray-400">ตัวอย่าง</p>
            <div
              ref="bodyRef"
              class="prose prose-sm max-w-none text-gray-800"
              v-html="form.body_html"
            />
          </div>
        </section>

        <aside class="space-y-4">
          <section class="space-y-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">ลำดับ</label>
              <input v-model.number="form.sort_order" type="number" min="0" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
            </div>
            <label class="flex cursor-pointer items-center justify-between gap-2 text-sm text-gray-700">
              <span>เปิดแท็บบนเว็บ</span>
              <button
                type="button"
                role="switch"
                :aria-checked="form.is_active"
                class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition"
                :class="form.is_active ? 'bg-emerald-500' : 'bg-gray-300'"
                @click="form.is_active = !form.is_active"
              >
                <span
                  class="inline-block size-5 translate-y-0.5 rounded-full bg-white shadow transition"
                  :class="form.is_active ? 'translate-x-5' : 'translate-x-0.5'"
                />
              </button>
            </label>
            <p class="text-xs text-gray-500">
              ปิด = ลูกค้าไม่เห็นแท็บนี้บนหน้า /faq
            </p>
          </section>
          <button
            type="button"
            class="w-full rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            @click="handleDelete"
          >
            ลบแท็บ
          </button>
        </aside>
      </div>
    </template>
  </div>
</template>
