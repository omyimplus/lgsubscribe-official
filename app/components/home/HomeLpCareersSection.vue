<script setup lang="ts">
import { LP_APPLY_PATH, LP_CAREERS_SECTION } from '~~/shared/utils/lpApplicationContent'
</script>

<template>
  <section class="bg-gray-50 py-12 sm:py-16">
    <div class="index-container">
      <div class="mx-auto max-w-3xl text-center">
        <p class="text-sm font-semibold tracking-wide text-[#ea1917]">
          {{ LP_CAREERS_SECTION.sectionTitle }}
        </p>
        <h2 class="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          {{ LP_CAREERS_SECTION.title }}
        </h2>
      </div>

      <div class="mx-auto mt-8 max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 class="text-lg font-bold text-gray-900 sm:text-xl">
          {{ LP_CAREERS_SECTION.roleTitle }}
        </h3>
        <ul class="mt-4 space-y-2">
          <li
            v-for="item in LP_CAREERS_SECTION.qualifications"
            :key="item"
            class="flex gap-2 text-sm text-gray-700 sm:text-base"
          >
            <span class="text-[#06C755]" aria-hidden="true">✅</span>
            <span>{{ item }}</span>
          </li>
        </ul>
        <p class="mt-4 text-sm font-semibold text-gray-800">
          **{{ LP_CAREERS_SECTION.salesNote }}**
        </p>
        <p class="mt-4 rounded-lg bg-[#ea1917] px-4 py-3 text-sm leading-relaxed text-white">
          ***{{ LP_CAREERS_SECTION.scamWarning }}***
        </p>

        <div class="mt-8 text-center">
          <NuxtLink
            :to="LP_APPLY_PATH"
            class="inline-flex items-center justify-center rounded-full bg-[#ea1917] px-8 py-3 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(234,25,23,0.35)] transition hover:bg-[#d01514]"
          >
            {{ LP_CAREERS_SECTION.applyCta }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
