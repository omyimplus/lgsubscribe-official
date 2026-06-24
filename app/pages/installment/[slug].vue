<script setup lang="ts">
import {
  SUBSCRIBE_TERMS_HUB_TITLE,
  getSubscribeTermsDoc,
} from '~~/shared/utils/subscribeTermsContent'
import { SEO_INSTALLMENT } from '~~/shared/utils/siteSeoPresets'

definePageMeta({ layout: 'default' })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const doc = computed(() => getSubscribeTermsDoc(slug.value))
const { set: setBreadcrumb } = usePageBreadcrumb()

watch(doc, (value) => {
  if (!value) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบเอกสารข้อกำหนด' })
  }
  setBreadcrumb([
    { label: SUBSCRIBE_TERMS_HUB_TITLE, to: '/installment' },
    { label: value.shortTitle },
  ])
}, { immediate: true })

useSiteSeoFromPreset(SEO_INSTALLMENT, {
  title: () => doc.value?.title,
  description: () => doc.value?.description,
  schema: {
    breadcrumbs: computed(() => {
      const value = doc.value
      if (!value) return undefined
      return [
        { name: 'หน้าแรก', path: '/' },
        { name: SUBSCRIBE_TERMS_HUB_TITLE, path: '/installment' },
        { name: value.shortTitle },
      ]
    }),
  },
})
</script>

<template>
  <main v-if="doc" class="index-container py-10 sm:py-12">
    <div class="mb-6">
      <NuxtLink
        to="/installment"
        class="inline-flex items-center gap-1 text-sm font-medium text-[#ea1917] hover:underline"
      >
        <Icon name="heroicons:arrow-left" class="h-4 w-4" />
        กลับไปข้อกำหนดและเงื่อนไขให้บริการ
      </NuxtLink>
    </div>

    <SubscribeTermsDocument :doc="doc" />
  </main>
</template>
