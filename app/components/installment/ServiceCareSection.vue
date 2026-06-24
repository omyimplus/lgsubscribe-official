<script setup lang="ts">
import type { ServiceCarePagePublic, ServiceCareVideoPublic } from '~~/shared/types/serviceCare'
import { SERVICE_CARE_CATALOG } from '~~/shared/types/serviceCare'

const props = defineProps<{
  page: ServiceCarePagePublic
}>()

const menuOpen = ref(false)
const modalOpen = ref(false)
const activeItem = ref<ServiceCareVideoPublic | null>(null)

const visibleItems = computed(() => props.page.items.filter(item => item.video))

const iconBySlug = computed(() =>
  Object.fromEntries(SERVICE_CARE_CATALOG.map(item => [item.slug, item.icon])),
)

function openMenu() {
  menuOpen.value = true
}

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function openVideo(item: ServiceCareVideoPublic) {
  if (!item.video) return
  activeItem.value = item
  modalOpen.value = true
  closeMenu()
}

function closeModal() {
  modalOpen.value = false
  activeItem.value = null
}
</script>

<template>
  <section
    v-if="visibleItems.length"
    class="mt-10"
  >
    <div
      class="relative inline-block max-w-full"
      @mouseenter="openMenu"
      @mouseleave="closeMenu"
    >
      <button
        type="button"
        class="flex min-w-[16rem] items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:border-[#ea1917]/30 hover:bg-white sm:min-w-[20rem]"
        :aria-expanded="menuOpen"
        @click="toggleMenu"
      >
        <span class="text-sm font-semibold text-gray-900 sm:text-base">
          {{ page.title }}
        </span>
        <Icon
          name="heroicons:chevron-right"
          class="h-5 w-5 shrink-0 text-gray-500"
        />
      </button>

      <ul
        v-show="menuOpen"
        class="absolute left-0 top-0 z-20 ml-[calc(100%+0.5rem)] hidden w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-xl lg:block"
      >
        <li
          v-for="item in visibleItems"
          :key="item.slug"
          class="border-b border-gray-800 last:border-b-0"
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white transition hover:bg-gray-800 sm:text-base"
            @click="openVideo(item)"
          >
            <Icon
              :name="iconBySlug[item.slug] ?? 'heroicons:play-circle'"
              class="h-5 w-5 shrink-0 text-[#ea1917]"
            />
            <span class="min-w-0 flex-1">{{ item.full_label }}</span>
            <Icon name="heroicons:play-circle" class="h-5 w-5 shrink-0 text-gray-400" />
          </button>
        </li>
      </ul>

      <ul
        v-show="menuOpen"
        class="mt-2 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg lg:hidden"
      >
        <li
          v-for="item in visibleItems"
          :key="`mobile-${item.slug}`"
          class="border-b border-gray-800 last:border-b-0"
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white transition hover:bg-gray-800 sm:text-base"
            @click="openVideo(item)"
          >
            <Icon
              :name="iconBySlug[item.slug] ?? 'heroicons:play-circle'"
              class="h-5 w-5 shrink-0 text-[#ea1917]"
            />
            <span class="min-w-0 flex-1">{{ item.full_label }}</span>
            <Icon name="heroicons:play-circle" class="h-5 w-5 shrink-0 text-gray-400" />
          </button>
        </li>
      </ul>
    </div>

    <StorefrontYoutubeVideoModal
      v-if="activeItem?.video"
      :open="modalOpen"
      :video-id="activeItem.video.video_id"
      :title="activeItem.full_label"
      @update:open="(value) => { if (!value) closeModal() }"
    />
  </section>
</template>
