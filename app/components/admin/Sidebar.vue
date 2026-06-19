<script setup lang="ts">
defineEmits<{ logout: [] }>()

const route = useRoute()
const { getRole } = useAuth()
const role = ref<'admin' | 'employee' | 'customer'>('employee')

onMounted(async () => {
  role.value = await getRole()
})

const navGroups = [
  {
    label: 'ภาพรวม',
    items: [
      { label: 'Dashboard', icon: 'heroicons:squares-2x2', to: '/admin' },
    ],
  },
  {
    label: 'จัดการข้อมูล',
    items: [
      { label: 'สินค้า', icon: 'heroicons:tag', to: '/admin/products' },
      { label: 'กลุ่มสินค้า', icon: 'heroicons:squares-2x2', to: '/admin/product-groups' },
      { label: 'หมวดหมู่', icon: 'heroicons:folder', to: '/admin/categories' },
      { label: 'Tags', icon: 'heroicons:hashtag', to: '/admin/tags' },
      { label: 'ลูกค้า', icon: 'heroicons:user-group', to: '/admin/customers' },
      { label: 'คำขอสนใจผ่อน', icon: 'heroicons:chat-bubble-left-right', to: '/admin/inquiries' },
      { label: 'โปรโมชั่น', icon: 'heroicons:gift', to: '/admin/promotions' },
      { label: 'บทความ', icon: 'heroicons:newspaper', to: '/admin/articles' },
      { label: 'YouTube หน้าแรก', icon: 'heroicons:play-circle', to: '/admin/home-youtube' },
      { label: 'Customer Experiences', icon: 'heroicons:sparkles', to: '/admin/customer-experiences' },
      { label: 'FAQ', icon: 'heroicons:question-mark-circle', to: '/admin/faq' },
      { label: 'Combo ส่วนลด', icon: 'heroicons:squares-plus', to: '/admin/combo-programs' },
    ],
  },
  {
    label: 'นำเข้าข้อมูล',
    items: [
      { label: 'Import จาก LG.com', icon: 'heroicons:arrow-down-tray', to: '/admin/import' },
      { label: 'Import จาก URL LG', icon: 'heroicons:link', to: '/admin/import-url' },
    ],
  },
  {
    label: 'ระบบ',
    items: [{ label: 'Line OA', icon: 'heroicons:bell', to: '/admin/line-oa' }],
  },
]

const visibleNavGroups = computed(() =>
  navGroups.map((group) => {
    if (group.label !== 'ระบบ') return group
    return {
      ...group,
      items: role.value === 'admin'
        ? [{ label: 'ผู้ใช้งาน', icon: 'heroicons:users', to: '/admin/users' }, ...group.items]
        : group.items,
    }
  }),
)

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  if (route.path === to) return true
  // อย่าให้ /admin/import ไป match /admin/import-url
  return route.path.startsWith(`${to}/`)
}
</script>

<template>
  <aside class="flex h-full w-64 shrink-0 flex-col bg-gray-900 text-white">
    <!-- Logo -->
    <div class="flex h-16 items-center gap-3 border-b border-gray-700 px-5">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-sm font-bold">
        LG
      </div>
      <div>
        <p class="text-sm font-semibold leading-tight">LG Subscribe</p>
        <p class="text-xs text-gray-400">Backend Office</p>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      <div v-for="group in visibleNavGroups" :key="group.label">
        <p class="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {{ group.label }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="item in group.items" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="isActive(item.to)
                ? 'bg-red-500 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'"
            >
              <Icon :name="item.icon" class="h-4 w-4 shrink-0" />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Logout -->
    <div class="border-t border-gray-700 p-3">
      <button
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        @click="$emit('logout')"
      >
        <Icon name="heroicons:arrow-left-on-rectangle" class="h-4 w-4 shrink-0" />
        ออกจากระบบ
      </button>
    </div>
  </aside>
</template>
