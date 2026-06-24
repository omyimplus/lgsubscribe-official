<script setup lang="ts">
const { visible, accept } = useCookieConsent()
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-full opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-full opacity-0"
      >
        <div
          v-if="visible"
          class="fixed inset-x-0 bottom-0 z-[85] border-t border-gray-200 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm"
          role="region"
          aria-label="การยินยอมคุกกี้"
        >
          <div class="index-container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-5">
            <p class="text-sm leading-relaxed text-gray-700">
              เว็บไซต์นี้ใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งานและวิเคราะห์การเข้าชม
              อ่านรายละเอียดได้ที่
              <NuxtLink to="/privacy" class="font-medium text-[#ea1917] hover:underline">
                นโยบายความเป็นส่วนตัว
              </NuxtLink>
            </p>
            <button
              type="button"
              class="shrink-0 rounded-full bg-[#ea1917] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c91513] sm:min-w-[8.5rem]"
              @click="accept"
            >
              ยอมรับ
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
