<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import type { MainCategory } from '~~/shared/types/main-category'
import type { Category } from '~~/shared/types/category'
import { groupProducts } from '~~/shared/utils/productGroupDisplay'
import { categoriesGroupedByMain } from '~~/shared/utils/categoryDisplay'
import PromotionGiftProductPicker from '~/components/admin/promotion/PromotionGiftProductPicker.vue'

export type GiftDraft = {
  localId: string
  product_id: string
  label: string
}

export type OfferDraft = {
  localId: string
  product_id: string
  title_override: string
  description: string
  has_gift: boolean
  gifts: GiftDraft[]
  installment_monthly: string
  installment_total: string
}

const props = defineProps<{
  catalogProducts: Product[]
  /** รายการสินค้าสำหรับเลือกของแถม — รวมแบบร่าง */
  giftCatalogProducts?: Product[]
  catalogPending?: boolean
  mainCategories: MainCategory[]
  categories: Category[]
  modelValue: OfferDraft[]
}>()

const giftProducts = computed(() => props.giftCatalogProducts ?? props.catalogProducts)

const emit = defineEmits<{
  'update:modelValue': [offers: OfferDraft[]]
}>()

const offers = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const pickerOpen = ref(false)
const filterCategoryId = ref('')
const pickerSearch = ref('')

const categoryPickerGroups = computed(() =>
  categoriesGroupedByMain(props.mainCategories ?? [], props.categories ?? [], { onlyActive: true }),
)

function productCountByCategory(categoryId: string) {
  return (props.catalogProducts ?? []).filter(p => p.category_id === categoryId).length
}

const categoryProducts = computed(() => {
  if (!filterCategoryId.value) return []
  return (props.catalogProducts ?? []).filter(p => p.category_id === filterCategoryId.value)
})

const displayGroups = computed(() => groupProducts(categoryProducts.value))

const filteredGroups = computed(() => {
  const q = pickerSearch.value.trim().toLowerCase()
  if (!q) return displayGroups.value
  return displayGroups.value.filter(g =>
    g.displayName.toLowerCase().includes(q)
    || g.variants.some(v =>
      v.sku.toLowerCase().includes(q)
      || v.name.toLowerCase().includes(q),
    ),
  )
})

function productById(id: string) {
  return (props.catalogProducts ?? []).find(p => p.id === id)
}

function newLocalId() {
  return crypto.randomUUID()
}

function emptyOffer(productId: string): OfferDraft {
  return {
    localId: newLocalId(),
    product_id: productId,
    title_override: '',
    description: '',
    has_gift: false,
    gifts: [],
    installment_monthly: '',
    installment_total: '',
  }
}

function emptyGift(): GiftDraft {
  return {
    localId: newLocalId(),
    product_id: '',
    label: '',
  }
}

function openPicker() {
  filterCategoryId.value = ''
  pickerSearch.value = ''
  pickerOpen.value = true
}

function addProduct(productId: string) {
  offers.value = [...offers.value, emptyOffer(productId)]
  pickerOpen.value = false
}

function removeOffer(index: number) {
  const next = [...offers.value]
  next.splice(index, 1)
  offers.value = next
}

function moveOffer(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= offers.value.length) return
  const next = [...offers.value]
  const tmp = next[index]!
  next[index] = next[target]!
  next[target] = tmp
  offers.value = next
}

function onHasGiftChange(offer: OfferDraft, checked: boolean) {
  offer.has_gift = checked
  if (!checked) offer.gifts = []
}

function addGift(offer: OfferDraft) {
  offer.gifts = [...offer.gifts, emptyGift()]
}

function removeGift(offer: OfferDraft, giftLocalId: string) {
  offer.gifts = offer.gifts.filter(g => g.localId !== giftLocalId)
}
</script>

<template>
  <section class="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
      <div>
        <h2 class="text-sm font-semibold text-gray-800">ชิ้นสินค้าในหน้าโปร</h2>
        <p class="mt-0.5 text-xs text-gray-500">
          เพิ่มแถวได้ไม่จำกัด — สินค้าเดียวกันใส่ซ้ำได้ (เช่น ทีวีเดียวกัน แถวแถม / แถวไม่แถม)
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        @click="openPicker"
      >
        <Icon name="heroicons:plus" class="h-4 w-4" />
        เพิ่มชิ้นสินค้า
      </button>
    </div>

    <div v-if="!offers.length" class="p-8 text-center text-sm text-gray-500">
      ยังไม่มีชิ้นสินค้า — กด «เพิ่มชิ้นสินค้า» เพื่อเริ่มต้น
    </div>

    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="(offer, index) in offers"
        :key="offer.localId"
        class="space-y-4 p-4 sm:p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-mono text-xs text-gray-400">{{ productById(offer.product_id)?.sku }}</p>
            <p class="text-base font-semibold text-gray-900">
              {{ productById(offer.product_id)?.name ?? offer.product_id }}
            </p>
          </div>
          <div class="flex shrink-0 gap-1">
            <button
              type="button"
              class="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
              :disabled="index === 0"
              title="เลื่อนขึ้น"
              @click="moveOffer(index, -1)"
            >
              <Icon name="heroicons:chevron-up" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
              :disabled="index === offers.length - 1"
              title="เลื่อนลง"
              @click="moveOffer(index, 1)"
            >
              <Icon name="heroicons:chevron-down" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
              title="ลบแถวนี้"
              @click="removeOffer(index)"
            >
              <Icon name="heroicons:trash" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">ชื่อที่แสดง (optional)</label>
            <input
              v-model="offer.title_override"
              type="text"
              placeholder="ว่าง = ใช้ชื่อสินค้า"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
          </div>
          <div class="flex items-end">
            <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                :checked="offer.has_gift"
                type="checkbox"
                class="rounded border-gray-300"
                @change="onHasGiftChange(offer, ($event.target as HTMLInputElement).checked)"
              >
              มีของแถม
            </label>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">คำอธิบายชิ้นนี้</label>
          <textarea
            v-model="offer.description"
            rows="3"
            placeholder="admin เขียนรายละเอียดโปรสำหรับแถวนี้"
            class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <div v-if="offer.has_gift" class="space-y-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-semibold text-amber-900">ของแถม (เพิ่มได้หลายชิ้น)</p>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-50"
              @click="addGift(offer)"
            >
              <Icon name="heroicons:plus" class="h-3.5 w-3.5" />
              เพิ่มของแถม
            </button>
          </div>

          <p v-if="!offer.gifts.length" class="text-xs text-amber-800/80">
            ยังไม่มีของแถม — กด «เพิ่มของแถม» แล้วเลือกหมวดหมู่ → สินค้า
          </p>

          <div
            v-for="(gift, giftIndex) in offer.gifts"
            :key="gift.localId"
            class="space-y-3 rounded-xl border border-amber-200/70 bg-white/80 p-3"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs font-medium text-gray-700">ของแถมชิ้นที่ {{ giftIndex + 1 }}</p>
              <button
                type="button"
                class="text-xs text-red-500 hover:underline"
                @click="removeGift(offer, gift.localId)"
              >
                ลบ
              </button>
            </div>
            <PromotionGiftProductPicker
              v-model="gift.product_id"
              :catalog-products="giftProducts"
              :catalog-pending="catalogPending"
              :main-categories="mainCategories"
              :categories="categories"
            />
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">ข้อความแสดง (optional)</label>
              <input
                v-model="gift.label"
                type="text"
                placeholder="เช่น แถม Soundbar XX"
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
            </div>
          </div>
        </div>

        <fieldset class="space-y-3 rounded-xl border border-gray-200 p-4">
          <legend class="px-1 text-xs font-semibold text-gray-700">ราคาโปรโมชั่น</legend>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs text-gray-500">ผ่อนเริ่มต้น (บาท/เดือน)</label>
              <input
                v-model="offer.installment_monthly"
                type="text"
                inputmode="decimal"
                placeholder="เช่น 1299"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-500">รวมผ่อนทั้งสัญญา</label>
              <input
                v-model="offer.installment_total"
                type="text"
                inputmode="decimal"
                placeholder="เช่น 38970"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
            </div>
          </div>
        </fieldset>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="pickerOpen"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        @click.self="pickerOpen = false"
      >
        <div class="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 class="text-sm font-semibold text-gray-900">เลือกสินค้าเพิ่มในหน้าโปร</h3>
            <button type="button" class="rounded-lg p-1 text-gray-400 hover:bg-gray-100" @click="pickerOpen = false">
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </button>
          </div>
          <div class="space-y-2 border-b border-gray-100 p-4">
            <select
              v-model="filterCategoryId"
              class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">— เลือกหมวดหมู่ —</option>
              <optgroup v-for="g in categoryPickerGroups" :key="g.main.id" :label="g.main.name">
                <option
                  v-for="c in g.categories"
                  :key="c.id"
                  :value="c.id"
                  :disabled="!productCountByCategory(c.id)"
                >
                  {{ c.name }}{{ productCountByCategory(c.id) ? ` (${productCountByCategory(c.id)})` : '' }}
                </option>
              </optgroup>
            </select>
            <input
              v-model="pickerSearch"
              type="search"
              placeholder="ค้นหา SKU / ชื่อ..."
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              :disabled="!filterCategoryId"
            >
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto">
            <div v-if="catalogPending" class="p-8 text-center text-sm text-gray-400">กำลังโหลด...</div>
            <div v-else-if="!filterCategoryId" class="p-8 text-center text-sm text-gray-500">เลือกหมวดหมู่ก่อน</div>
            <div v-else-if="!filteredGroups.length" class="p-8 text-center text-sm text-gray-500">ไม่พบสินค้า</div>
            <div v-else class="divide-y divide-gray-100">
              <template v-for="group in filteredGroups" :key="group.groupId ?? group.variants[0]!.id">
                <button
                  v-for="v in group.variants"
                  :key="v.id"
                  type="button"
                  class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  @click="addProduct(v.id)"
                >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-gray-900">{{ v.name }}</p>
                    <p class="font-mono text-xs text-gray-500">{{ v.sku }}</p>
                  </div>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
