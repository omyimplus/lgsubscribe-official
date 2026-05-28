<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const { data: userCount } = await useFetch<number>('/api/admin/users', {
  transform: users => users?.length ?? 0,
  default: () => 0,
})

const stats = computed(() => [
  { label: 'สินค้าทั้งหมด', value: '0', icon: 'heroicons:tag', bg: 'bg-blue-50', text: 'text-blue-600' },
  { label: 'รออนุมัติ (Pending)', value: '0', icon: 'heroicons:clock', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  { label: 'โปรโมชั่นที่ใช้งาน', value: '0', icon: 'heroicons:gift', bg: 'bg-green-50', text: 'text-green-600' },
  { label: 'ผู้ใช้งาน', value: String(userCount.value ?? 0), icon: 'heroicons:users', bg: 'bg-purple-50', text: 'text-purple-600' },
])
</script>

<template>
  <div class="space-y-6">
    <!-- Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-xl bg-white p-5 shadow-sm border border-gray-100"
      >
        <div class="flex items-center gap-4">
          <div :class="['flex h-11 w-11 items-center justify-center rounded-xl', stat.bg, stat.text]">
            <Icon :name="stat.icon" class="h-5 w-5" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-800">{{ stat.value }}</p>
            <p class="text-xs text-gray-500">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending import -->
    <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-semibold text-gray-700">สินค้ารออนุมัติ (Pending Import)</h2>
        <NuxtLink to="/admin/import" class="text-xs text-red-500 hover:underline">
          ไปที่ Import →
        </NuxtLink>
      </div>
      <div class="flex flex-col items-center justify-center py-10 text-gray-400">
        <Icon name="heroicons:inbox" class="h-10 w-10 mb-2 opacity-40" />
        <p class="text-sm">ยังไม่มีสินค้ารออนุมัติ</p>
      </div>
    </div>
  </div>
</template>
