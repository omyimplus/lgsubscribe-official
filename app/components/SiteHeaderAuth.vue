<script setup lang="ts">
const session = useCustomerSession()
const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function closeMenu() {
  menuOpen.value = false
}

function onDocumentClick(e: MouseEvent) {
  if (!menuRef.value?.contains(e.target as Node)) {
    closeMenu()
  }
}

watch(menuOpen, (open) => {
  if (!import.meta.client) return
  if (open) {
    document.addEventListener('click', onDocumentClick)
  }
  else {
    document.removeEventListener('click', onDocumentClick)
  }
})

onUnmounted(() => {
  if (!import.meta.client) return
  document.removeEventListener('click', onDocumentClick)
})

async function handleSignOut() {
  closeMenu()
  await session.signOut()
}
</script>

<template>
  <div v-if="!session.ready.value" class="h-9 w-16 animate-pulse rounded-full bg-gray-100 sm:w-20" />

  <template v-else-if="session.isLoggedIn.value">
    <div ref="menuRef" class="relative">
      <button
        type="button"
        class="inline-flex max-w-[160px] items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-1.5 pr-3 text-sm transition hover:border-red-200 hover:bg-red-50 sm:max-w-[200px]"
        @click.stop="menuOpen = !menuOpen"
      >
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
          {{ session.displayName.value.charAt(0).toUpperCase() }}
        </span>
        <span class="truncate font-medium text-gray-800">
          {{ session.displayName.value }}
        </span>
        <Icon name="heroicons:chevron-down" class="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="menuOpen"
          class="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          <div class="border-b border-gray-100 px-4 py-2.5">
            <p class="truncate text-sm font-semibold text-gray-900">{{ session.displayName.value }}</p>
            <p v-if="session.user.value?.email" class="truncate text-xs text-gray-500">
              {{ session.user.value.email }}
            </p>
          </div>
          <NuxtLink
            to="/account"
            class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            @click="closeMenu"
          >
            <Icon name="heroicons:user-circle" class="h-4 w-4 text-gray-400" />
            บัญชีของฉัน
          </NuxtLink>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            @click="handleSignOut"
          >
            <Icon name="heroicons:arrow-left-on-rectangle" class="h-4 w-4" />
            ออกจากระบบ
          </button>
        </div>
      </Transition>
    </div>
  </template>

  <template v-else>
    <NuxtLink
      to="/auth/login"
      class="text-sm text-gray-600 hover:text-red-600"
    >
      เข้าสู่ระบบ
    </NuxtLink>
    <NuxtLink
      to="/auth/register"
      class="rounded-full bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
    >
      สมัครสมาชิก
    </NuxtLink>
  </template>
</template>
