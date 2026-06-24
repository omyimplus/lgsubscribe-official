<script setup lang="ts">
import type { SubscribeTermsDoc } from '~~/shared/utils/subscribeTermsContent'

defineProps<{
  doc: SubscribeTermsDoc
}>()
</script>

<template>
  <article class="subscribe-terms-doc">
    <header class="max-w-4xl">
      <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
        {{ doc.title }}
      </h1>
      <p class="mt-2 text-sm text-gray-500">
        อัปเดตล่าสุด: {{ doc.updated }}
      </p>
    </header>

    <div
      class="subscribe-terms-doc__body mt-8 max-w-4xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
      v-html="doc.contentHtml"
    />
  </article>
</template>

<style scoped>
.subscribe-terms-doc__body :deep(p) {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: #374151;
}

@media (min-width: 640px) {
  .subscribe-terms-doc__body :deep(p) {
    font-size: 1rem;
  }
}

.subscribe-terms-doc__body :deep(p:first-child) {
  margin-top: 0;
}

.subscribe-terms-doc__body :deep(b),
.subscribe-terms-doc__body :deep(strong) {
  font-weight: 600;
  color: #111827;
}

.subscribe-terms-doc__body :deep(ul) {
  margin-top: 0.75rem;
  list-style: disc;
  padding-left: 1.25rem;
}

.subscribe-terms-doc__body :deep(li) {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: #374151;
}

.subscribe-terms-doc__body :deep(table) {
  display: block;
  width: 100%;
  margin-top: 1rem;
  overflow-x: auto;
  border-collapse: collapse;
  font-size: 0.75rem;
}

@media (min-width: 640px) {
  .subscribe-terms-doc__body :deep(table) {
    font-size: 0.875rem;
  }
}

.subscribe-terms-doc__body :deep(th),
.subscribe-terms-doc__body :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.625rem;
  vertical-align: top;
  text-align: left;
}

.subscribe-terms-doc__body :deep(th) {
  background: #f9fafb;
  font-weight: 600;
  color: #111827;
}
</style>
