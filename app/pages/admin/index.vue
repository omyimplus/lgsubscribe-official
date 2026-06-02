<script setup lang="ts">
import type { ProductStatus } from '~~/shared/types/product'
import type { PromotionStatus } from '~~/shared/types/promotion'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

type DashboardData = {
  products: {
    total: number
    published: number
    draft: number
    pending: number
    inactive: number
  }
  promotions: {
    total: number
    published: number
    live: number
  }
  customers: number
  productGroups: number
  inquiries: { new: number }
  import: {
    batch: { id: string, source: string, status: string, created_at: string } | null
    itemCount: number
  }
  recentProducts: {
    id: string
    name: string
    sku: string
    status: ProductStatus
    updated_at: string
    image_url: string | null
  }[]
  recentPromotions: {
    id: string
    title: string
    slug: string
    status: PromotionStatus
    updated_at: string
    product_count: number
  }[]
}

const { data, pending, error, refresh } = await useFetch<DashboardData>('/api/admin/dashboard', {
  default: () => ({
    products: { total: 0, published: 0, draft: 0, pending: 0, inactive: 0 },
    promotions: { total: 0, published: 0, live: 0 },
    customers: 0,
    productGroups: 0,
    inquiries: { new: 0 },
    import: { batch: null, itemCount: 0 },
    recentProducts: [],
    recentPromotions: [],
  }),
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'สวัสดีตอนเช้า'
  if (h < 17) return 'สวัสดีตอนบ่าย'
  return 'สวัสดีตอนเย็น'
})

const todayLabel = computed(() =>
  new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
)

const statCards = computed(() => [
  {
    label: 'สินค้าทั้งหมด',
    value: data.value?.products.total ?? 0,
    hint: `${data.value?.products.published ?? 0} เผยแพร่`,
    icon: 'heroicons:cube',
    bg: 'bg-sky-50',
    iconBg: 'bg-sky-500',
    to: '/admin/products',
  },
  {
    label: 'โปรโมชั่นเปิดอยู่',
    value: data.value?.promotions.live ?? 0,
    hint: `${data.value?.promotions.total ?? 0} โปรทั้งหมด`,
    icon: 'heroicons:gift',
    bg: 'bg-rose-50',
    iconBg: 'bg-rose-500',
    to: '/admin/promotions',
  },
  {
    label: 'กลุ่มสินค้า (PLP)',
    value: data.value?.productGroups ?? 0,
    hint: 'การ์ดบนหน้าร้าน',
    icon: 'heroicons:squares-2x2',
    bg: 'bg-violet-50',
    iconBg: 'bg-violet-500',
    to: '/admin/product-groups',
  },
  {
    label: 'ลูกค้าสมัคร',
    value: data.value?.customers ?? 0,
    hint: 'โปรไฟล์ในระบบ',
    icon: 'heroicons:user-group',
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-500',
    to: '/admin/customers',
  },
  {
    label: 'คำขอสนใจผ่อน (ใหม่)',
    value: data.value?.inquiries.new ?? 0,
    hint: 'รอติดต่อจากหน้าร้าน',
    icon: 'heroicons:chat-bubble-left-right',
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-500',
    to: '/admin/inquiries',
  },
])

const quickActions = [
  { label: 'Import จาก LG', desc: 'ดึงสินค้าเข้า draft', icon: 'heroicons:arrow-down-tray', to: '/admin/import', color: 'text-sky-700 bg-sky-50 hover:bg-sky-100' },
  { label: 'เพิ่มสินค้า', desc: 'สร้าง SKU ใหม่', icon: 'heroicons:plus-circle', to: '/admin/products/new', color: 'text-red-700 bg-red-50 hover:bg-red-100' },
  { label: 'สร้างโปรโมชั่น', desc: 'เลือก SKU แสดงหน้าโปร', icon: 'heroicons:sparkles', to: '/admin/promotions', color: 'text-amber-700 bg-amber-50 hover:bg-amber-100' },
  { label: 'จัดกลุ่ม PLP', desc: 'แก้การ์ดหลายขนาด', icon: 'heroicons:rectangle-group', to: '/admin/product-groups', color: 'text-violet-700 bg-violet-50 hover:bg-violet-100' },
  { label: 'คำขอสนใจผ่อน', desc: 'ติดตาม lead จากหน้าร้าน', icon: 'heroicons:chat-bubble-left-right', to: '/admin/inquiries', color: 'text-orange-700 bg-orange-50 hover:bg-orange-100' },
  { label: 'หมวดหมู่', desc: 'เรียงและจัดการหมวด', icon: 'heroicons:folder', to: '/admin/categories', color: 'text-gray-700 bg-gray-100 hover:bg-gray-200' },
  { label: 'ดูหน้าร้าน', desc: 'เปิดเว็บลูกค้า', icon: 'heroicons:globe-alt', to: '/products', external: true, color: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' },
]

const productStatusRows = computed(() => {
  const p = data.value?.products
  if (!p) return []
  return [
    { key: 'published', label: 'เผยแพร่', count: p.published, color: 'bg-emerald-500', pct: pct(p.published, p.total) },
    { key: 'draft', label: 'แบบร่าง', count: p.draft, color: 'bg-gray-400', pct: pct(p.draft, p.total) },
    { key: 'pending', label: 'รออนุมัติ', count: p.pending, color: 'bg-amber-500', pct: pct(p.pending, p.total) },
  ]
})

function pct(n: number, total: number) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

function statusLabel(s: ProductStatus) {
  if (s === 'published') return 'เผยแพร่'
  if (s === 'pending') return 'รออนุมัติ'
  return 'แบบร่าง'
}

function statusClass(s: ProductStatus) {
  if (s === 'published') return 'bg-emerald-50 text-emerald-700'
  if (s === 'pending') return 'bg-amber-50 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

function promoStatusLabel(s: PromotionStatus) {
  return s === 'published' ? 'เผยแพร่' : 'แบบร่าง'
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'เมื่อสักครู่'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชม. ที่แล้ว`
  const days = Math.floor(hours / 24)
  return `${days} วันที่แล้ว`
}
</script>

<template>
  <div class="space-y-8">
    <!-- Hero -->
    <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-red-950 px-6 py-8 text-white shadow-lg sm:px-8">
      <div class="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />
      <div class="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
      <div class="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-medium text-red-200">{{ todayLabel }}</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {{ greeting }} 👋
          </h2>
          <p class="mt-2 max-w-xl text-sm text-gray-300">
            ภาพรวม LG Subscribe — สินค้า โปรโมชั่น และงาน import ในที่เดียว
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/15 disabled:opacity-50"
          :disabled="pending"
          @click="refresh()"
        >
          <Icon name="heroicons:arrow-path" class="h-4 w-4" :class="{ 'animate-spin': pending }" />
          รีเฟรช
        </button>
      </div>
    </section>

    <div v-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      โหลดข้อมูล Dashboard ไม่สำเร็จ — {{ error.message }}
    </div>

    <!-- Stats -->
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      <NuxtLink
        v-for="card in statCards"
        :key="card.label"
        :to="card.to"
        class="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200 hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-3">
          <div :class="['flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm', card.iconBg]">
            <Icon :name="card.icon" class="h-5 w-5" />
          </div>
          <Icon name="heroicons:arrow-up-right" class="h-4 w-4 text-gray-300 transition group-hover:text-gray-500" />
        </div>
        <p class="mt-4 text-3xl font-bold tracking-tight text-gray-900">
          {{ pending ? '—' : card.value }}
        </p>
        <p class="mt-1 text-sm font-medium text-gray-700">{{ card.label }}</p>
        <p class="mt-0.5 text-xs text-gray-400">{{ card.hint }}</p>
      </NuxtLink>
    </section>

    <div class="grid gap-6 xl:grid-cols-3">
      <!-- Main column -->
      <div class="space-y-6 xl:col-span-2">
        <!-- Quick actions -->
        <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-900">ทางลัด</h3>
          <p class="mt-0.5 text-xs text-gray-500">งานที่ใช้บ่อยใน Backend Office</p>
          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <component
              :is="action.external ? 'a' : 'NuxtLink'"
              v-for="action in quickActions"
              :key="action.label"
              :to="action.external ? undefined : action.to"
              :href="action.external ? action.to : undefined"
              :target="action.external ? '_blank' : undefined"
              :rel="action.external ? 'noopener noreferrer' : undefined"
              class="flex items-start gap-3 rounded-xl p-3 transition"
              :class="action.color"
            >
              <Icon :name="action.icon" class="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p class="text-sm font-semibold">{{ action.label }}</p>
                <p class="text-xs opacity-80">{{ action.desc }}</p>
              </div>
            </component>
          </div>
        </section>

        <!-- Recent products -->
        <section class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 class="text-sm font-semibold text-gray-900">สินค้าอัปเดตล่าสุด</h3>
              <p class="text-xs text-gray-500">6 รายการล่าสุด</p>
            </div>
            <NuxtLink to="/admin/products" class="text-xs font-semibold text-red-600 hover:underline">
              ดูทั้งหมด
            </NuxtLink>
          </div>
          <div v-if="pending" class="py-12 text-center text-sm text-gray-400">กำลังโหลด...</div>
          <div v-else-if="!data?.recentProducts.length" class="py-12 text-center text-sm text-gray-500">
            ยังไม่มีสินค้า
          </div>
          <ul v-else class="divide-y divide-gray-50">
            <li v-for="p in data.recentProducts" :key="p.id">
              <NuxtLink
                :to="`/admin/products/${p.id}`"
                class="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-50/80"
              >
                <div class="h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                  <img v-if="p.image_url" :src="p.image_url" :alt="p.name" class="h-full w-full object-cover">
                  <div v-else class="flex h-full items-center justify-center">
                    <Icon name="heroicons:photo" class="h-5 w-5 text-gray-300" />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-gray-900">{{ p.name }}</p>
                  <p class="font-mono text-xs text-gray-500">{{ p.sku }}</p>
                </div>
                <div class="shrink-0 text-right">
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="statusClass(p.status)">
                    {{ statusLabel(p.status) }}
                  </span>
                  <p class="mt-1 text-[10px] text-gray-400">{{ formatRelativeTime(p.updated_at) }}</p>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>

      <!-- Sidebar column -->
      <div class="space-y-6">
        <!-- Product status breakdown -->
        <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-900">สถานะสินค้า</h3>
          <p class="mt-0.5 text-xs text-gray-500">{{ data?.products.total ?? 0 }} SKU ทั้งหมด</p>
          <div v-if="data?.products.total" class="mt-4 flex h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              v-for="row in productStatusRows"
              :key="row.key"
              :class="row.color"
              :style="{ width: `${row.pct}%` }"
              :title="`${row.label} ${row.count}`"
            />
          </div>
          <ul class="mt-4 space-y-2">
            <li v-for="row in productStatusRows" :key="row.key" class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2 text-gray-600">
                <span :class="['h-2 w-2 rounded-full', row.color]" />
                {{ row.label }}
              </span>
              <span class="font-semibold text-gray-900">{{ row.count }}</span>
            </li>
          </ul>
          <NuxtLink
            to="/admin/products"
            class="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            จัดการสินค้า
          </NuxtLink>
        </section>

        <!-- Import draft -->
        <section
          class="rounded-2xl border p-5 shadow-sm"
          :class="data?.import.batch ? 'border-sky-200 bg-sky-50/50' : 'border-gray-100 bg-white'"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              :class="data?.import.batch ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-400'"
            >
              <Icon name="heroicons:arrow-down-tray" class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-semibold text-gray-900">Import Draft</h3>
              <template v-if="data?.import.batch">
                <p class="mt-1 text-sm text-sky-900">
                  {{ data.import.itemCount }} รายการรอ promote
                </p>
                <p class="text-xs text-sky-700/80">
                  Batch {{ data.import.batch.source }} · {{ formatRelativeTime(data.import.batch.created_at) }}
                </p>
              </template>
              <p v-else class="mt-1 text-sm text-gray-500">ไม่มี draft ค้างอยู่</p>
            </div>
          </div>
          <NuxtLink
            to="/admin/import"
            class="mt-4 inline-flex w-full items-center justify-center rounded-xl py-2 text-xs font-semibold transition"
            :class="data?.import.batch
              ? 'bg-sky-600 text-white hover:bg-sky-700'
              : 'border border-gray-200 text-gray-700 hover:bg-gray-50'"
          >
            {{ data?.import.batch ? 'ไปหน้า Import' : 'เริ่ม Import' }}
          </NuxtLink>
        </section>

        <!-- Recent promotions -->
        <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900">โปรโมชั่นล่าสุด</h3>
            <NuxtLink to="/admin/promotions" class="text-xs font-semibold text-red-600 hover:underline">
              ทั้งหมด
            </NuxtLink>
          </div>
          <div v-if="!data?.recentPromotions.length" class="mt-6 py-4 text-center text-sm text-gray-500">
            ยังไม่มีโปรโมชั่น
          </div>
          <ul v-else class="mt-3 divide-y divide-gray-50">
            <li v-for="promo in data.recentPromotions" :key="promo.id">
              <NuxtLink
                :to="`/admin/promotions/${promo.id}`"
                class="flex items-center justify-between gap-2 py-3 transition hover:opacity-80"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-gray-900">{{ promo.title }}</p>
                  <p class="text-xs text-gray-500">{{ promo.product_count }} SKU · {{ promoStatusLabel(promo.status) }}</p>
                </div>
                <Icon name="heroicons:chevron-right" class="h-4 w-4 shrink-0 text-gray-300" />
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
