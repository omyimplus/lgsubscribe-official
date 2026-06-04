<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import ProductListingFilterDrawer from '~/components/products/ProductListingFilterDrawer.vue'
import ProductListingPagination from '~/components/products/ProductListingPagination.vue'
import ProductListingSidebar from '~/components/products/ProductListingSidebar.vue'

definePageMeta({
  layout: 'default',
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: 'สินค้าทั้งหมด' },
  ],
})

useSeoMeta({
  title: 'สินค้าทั้งหมด — LG Subscribe',
})

const { data: products, pending, error } = await useFetch<Product[]>('/api/public/products', {
  key: 'public-products-list',
  default: () => [],
})

const productsRef = computed(() => products.value)

const {
  categoryGroups,
  categorySlug,
  sortKey,
  searchQuery,
  selectedCategoryLabel,
  filteredProducts,
  displayGroups,
  paginatedGroups,
  totalGroups,
  totalPages,
  currentPage,
  pageRangeLabel,
  setCategorySlug,
  setSortKey,
  setPage,
  clearFilters,
} = useProductListing(productsRef)

const filterDrawerOpen = ref(false)

const hasActiveFilters = computed(() =>
  !!categorySlug.value || sortKey.value !== 'default' || !!searchQuery.value,
)

function openFilterDrawer() {
  filterDrawerOpen.value = true
}

function setFilterDrawerOpen(value: boolean) {
  filterDrawerOpen.value = value
}

const route = useRoute()
watch(() => route.fullPath, () => {
  if (filterDrawerOpen.value) {
    filterDrawerOpen.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <main class="index-container py-8 sm:py-12">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
          สินค้าทั้งหมด
        </h1>
        <p v-if="searchQuery" class="mt-2 text-sm text-gray-600">
          ผลการค้นหา:
          <span class="font-medium text-gray-900">「{{ searchQuery }}」</span>
        </p>
        <p v-else-if="selectedCategoryLabel" class="mt-2 text-sm text-gray-600">
          หมวด: <span class="font-medium text-gray-900">{{ selectedCategoryLabel }}</span>
        </p>
        <p
          v-else-if="totalGroups && !pending"
          class="mt-2 text-sm text-gray-500"
        >
          แสดง {{ pageRangeLabel }} กลุ่มสินค้า
        </p>
      </div>

      <div v-if="pending" class="py-20 text-center text-gray-400">
        กำลังโหลดสินค้า...
      </div>

      <div v-else-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        โหลดสินค้าไม่สำเร็จ
      </div>

      <div
        v-else-if="!(products?.length)"
        class="py-20 text-center text-gray-500"
      >
        ยังไม่มีสินค้าที่เผยแพร่
      </div>

      <div v-else class="space-y-4">
        <div class="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            class="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]"
            :class="hasActiveFilters
              ? 'border-[#ea1917]/30 bg-red-50 text-[#ea1917]'
              : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'"
            :aria-expanded="filterDrawerOpen"
            aria-controls="product-listing-filter-drawer"
            @click="openFilterDrawer"
          >
            <Icon name="heroicons:funnel" class="h-5 w-5 shrink-0" />
            กรองและเรียง
          </button>
        </div>

        <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <ProductListingSidebar
            class="max-lg:hidden lg:block lg:w-56 lg:shrink-0 xl:w-64"
            :groups="categoryGroups ?? []"
            :category-slug="categorySlug"
            :sort-key="sortKey"
            :result-count="totalGroups"
            :sku-count="filteredProducts.length"
            :page-range-label="pageRangeLabel"
            @update:category="setCategorySlug"
            @update:sort="setSortKey"
            @clear="clearFilters"
          />

          <div class="min-w-0 flex-1">
          <div
            v-if="!displayGroups.length"
            class="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center text-sm text-gray-500"
          >
            <template v-if="searchQuery">
              ไม่พบสินค้าที่ตรงกับ「{{ searchQuery }}」 —
              <button
                type="button"
                class="font-medium text-[#ea1917] hover:underline"
                @click="clearFilters"
              >
                ล้างการค้นหา
              </button>
            </template>
            <template v-else-if="categorySlug">
              ไม่มีสินค้าในหมวดนี้ —
              <button
                type="button"
                class="font-medium text-[#ea1917] hover:underline"
                @click="clearFilters"
              >
                ดูทุกหมวด
              </button>
            </template>
            <template v-else>
              ยังไม่มีสินค้าที่เผยแพร่
            </template>
          </div>

          <template v-else>
            <p class="mb-4 text-sm text-gray-500 lg:hidden">
              แสดง {{ pageRangeLabel }} · หน้า {{ currentPage }}/{{ totalPages }}
            </p>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <ProductGroupCard
                v-for="g in paginatedGroups"
                :key="g.groupId ?? g.variants[0]!.id"
                :group="g"
              />
            </div>

            <ProductListingPagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @update:page="setPage"
            />
          </template>
          </div>
        </div>

        <ProductListingFilterDrawer
          id="product-listing-filter-drawer"
          :open="filterDrawerOpen"
          :groups="categoryGroups ?? []"
          :category-slug="categorySlug"
          :sort-key="sortKey"
          :result-count="totalGroups"
          :sku-count="filteredProducts.length"
          :page-range-label="pageRangeLabel"
          @update:open="setFilterDrawerOpen"
          @update:category="setCategorySlug"
          @update:sort="setSortKey"
          @clear="clearFilters"
        />
      </div>
    </main>
  </div>
</template>
