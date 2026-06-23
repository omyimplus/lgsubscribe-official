<script setup lang="ts">
import { LP_APPLY_PATH, LP_CAREERS_SECTION } from '~~/shared/utils/lpApplicationContent'

const promo = LP_CAREERS_SECTION.home
</script>

<template>
  <section class="bg-gray-50 py-12 sm:py-16">
    <div class="index-container">
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
        <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-stretch">
          <div class="border-b border-gray-100 bg-gradient-to-br from-[#ea1917]/[0.07] via-white to-white p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p class="text-sm font-semibold tracking-wide text-[#ea1917]">
              {{ LP_CAREERS_SECTION.sectionTitle }}
            </p>
            <h2 class="mt-2 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl">
              {{ promo.headline }}
            </h2>
            <p class="mt-2 text-lg font-semibold text-gray-800 sm:text-xl">
              {{ promo.subheadline }}
            </p>
            <p class="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
              {{ promo.lead }}
            </p>
            <p class="mt-4 text-sm leading-relaxed text-gray-700 sm:text-base">
              {{ promo.closing }}
            </p>
            <div class="mt-8">
              <NuxtLink
                :to="LP_APPLY_PATH"
                class="inline-flex items-center justify-center gap-2 rounded-full bg-[#ea1917] px-7 py-3 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(234,25,23,0.35)] transition hover:bg-[#d01514]"
              >
                {{ promo.cta }}
                <Icon name="heroicons:arrow-right" class="h-4 w-4" />
              </NuxtLink>
            </div>
          </div>

          <div class="flex flex-col justify-center gap-4 p-6 sm:p-8">
            <article
              v-for="item in promo.points"
              :key="item.title"
              class="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-4 sm:px-5"
            >
              <h3 class="text-base font-bold text-gray-900">
                {{ item.title }}
              </h3>
              <p class="mt-1.5 text-sm leading-relaxed text-gray-600">
                {{ item.text }}
              </p>
            </article>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
