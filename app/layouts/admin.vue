<script setup lang="ts">
const route = useRoute()
const { signOut } = useAuth()

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'สินค้า',
  '/admin/product-groups': 'กลุ่มสินค้า',
  '/admin/categories': 'หมวดหมู่',
  '/admin/tags': 'Tags',
  '/admin/customers': 'ลูกค้า',
  '/admin/promotions': 'โปรโมชั่น',
  '/admin/import': 'Import จาก LG.com',
  '/admin/users': 'ผู้ใช้งาน',
  '/admin/line-oa': 'Line OA',
}

const currentTitle = computed(() => {
  if (route.path === '/admin/products/new') return 'เพิ่มสินค้า'
  if (/^\/admin\/products\/[^/]+$/.test(route.path) && route.path !== '/admin/products/new') {
    return 'แก้ไขสินค้า'
  }
  if (/^\/admin\/products\/[^/]+\/detail\/[^/]+$/.test(route.path)) {
    return 'แก้ไขรายละเอียดภายใน'
  }
  if (/^\/admin\/import-items\/[^/]+\/detail\/[^/]+$/.test(route.path)) {
    return 'แก้ไขรายละเอียด Import Draft'
  }
  if (/^\/admin\/import-items\/[^/]+$/.test(route.path)) {
    return 'ตรวจรายละเอียด Import Draft'
  }
  if (route.path === '/admin/promotions') return 'โปรโมชั่น'
  if (/^\/admin\/promotions\/[^/]+$/.test(route.path)) {
    return 'แก้ไขโปรโมชั่น'
  }
  return pageTitles[route.path] ?? 'Backend Office'
})
</script>

<template>
  <div class="admin-app flex h-screen overflow-hidden bg-slate-100">
    <AdminSidebar @logout="signOut" />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <AdminHeader :title="currentTitle" />
      <main class="flex-1 overflow-y-auto">
        <div class="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
