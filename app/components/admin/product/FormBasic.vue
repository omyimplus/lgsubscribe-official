<script setup lang="ts">
import { PRODUCT_FORM_KEY } from './form-context'

const ctx = inject(PRODUCT_FORM_KEY)
if (!ctx) throw new Error('ProductFormBasic must be used inside product form page')

const {
  form,
  inputClass,
  pricingPreview,
  sortedMainCategories,
  allTags,
  categoriesForMain,
  toggleTag,
} = ctx
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-800">ข้อมูลการ์ดสินค้า</h3>
      <p class="mb-4 text-xs text-gray-500">ข้อมูลที่แสดงบนการ์ดสินค้าแบบ lg.com</p>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs font-medium text-gray-600">ชื่อสินค้า *</label>
          <input v-model="form.name" required :class="inputClass">
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">รหัสสินค้า (SKU) *</label>
          <input v-model="form.sku" required :class="[inputClass, 'font-mono']">
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">หมวดหมู่ *</label>
          <select v-model="form.category_id" required :class="inputClass">
            <option value="" disabled>เลือกหมวดหมู่</option>
            <optgroup v-for="main in sortedMainCategories" :key="main.id" :label="main.name">
              <option v-for="c in categoriesForMain(main.id)" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </optgroup>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs font-medium text-gray-600">หัวข้อหลัก (ข้อความโปรโมชั่น)</label>
          <input v-model="form.headline" placeholder="เช่น ยิ่งซับมาก ยิ่งลดมาก!" :class="inputClass">
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-sm font-semibold text-gray-800">ราคา</h3>
        <p class="text-xs text-amber-700">ใช้ import เท่านั้น — ไม่แสดงหน้าร้าน</p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">ราคาหลัก / เดือน *</label>
          <input v-model.number="form.base_price" type="number" min="0" step="0.01" required :class="inputClass">
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">ราคาเต็ม</label>
          <input v-model.number="form.full_price" type="number" min="0" step="0.01" :class="inputClass">
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">ช่วงราคา (อื่นๆ)</label>
          <input v-model="form.price_range" placeholder="เช่น 999-1,999" :class="inputClass">
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">ส่วนลด</label>
          <select v-model="form.discount_type" :class="inputClass">
            <option :value="null">ไม่มีส่วนลด</option>
            <option value="amount">จำนวนเงิน (บาท)</option>
            <option value="percent">เปอร์เซ็นต์ (%)</option>
          </select>
        </div>
        <div v-if="form.discount_type">
          <label class="mb-1 block text-xs font-medium text-gray-600">
            {{ form.discount_type === 'amount' ? 'ลด (บาท)' : 'ลด (%)' }}
          </label>
          <input v-model.number="form.discount_value" type="number" min="0" step="0.01" :class="inputClass">
        </div>
        <div class="flex flex-col justify-end rounded-xl bg-gray-50 p-3 text-sm">
          <p class="text-gray-500">ราคาหลังลด</p>
          <p class="text-lg font-bold text-red-600">{{ formatBaht(pricingPreview.discounted_price) }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-800">ข้อความใต้ราคา (การ์ดสินค้า)</h3>
      <p class="mb-4 text-xs text-gray-500">แสดงบนการ์ด lg.com — ไม่ใช้ HTML editor</p>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs font-medium text-gray-600">โน้ต subscription</label>
          <input
            v-model="form.subscription_note"
            placeholder="เช่น ส่วนลด 6 เดือนเท่านั้น"
            :class="inputClass"
          >
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">ข้อความลิงก์ซื้อเฉพาะสินค้า</label>
          <input
            v-model="form.purchase_only_label"
            placeholder="หรือซื้อเฉพาะสินค้าเท่านั้น"
            :class="inputClass"
          >
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">URL ลิงก์ซื้อเฉพาะสินค้า</label>
          <input
            v-model="form.purchase_only_url"
            type="url"
            placeholder="https://..."
            :class="inputClass"
          >
        </div>
        <div class="sm:col-span-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <p v-if="form.warranty_years">
            ตัวอย่างบรรทัดรับประกัน: ต่อเดือน รับประกันนาน {{ form.warranty_years }} ปี
            <span class="text-gray-400">(สร้างอัตโนมัติจาก "รับประกัน (ปี)" ด้านล่าง)</span>
          </p>
          <p v-else class="text-gray-400">กรอก "รับประกัน (ปี)" ในส่วนบริการเพื่อแสดงบรรทัดต่อเดือน + รับประกัน</p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-800">ข้อมูลรับประกัน</h3>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">รับประกัน (ปี)</label>
          <input v-model.number="form.warranty_years" type="number" min="0" :class="inputClass">
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-800">Tags & สถานะ</h3>
      <div class="mb-4 flex flex-wrap gap-2">
        <button
          v-for="t in allTags"
          :key="t.id"
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-medium transition"
          :class="form.tag_ids.includes(t.id) ? 'border-transparent text-white' : 'border-gray-200 bg-white text-gray-600'"
          :style="form.tag_ids.includes(t.id) ? { backgroundColor: t.color } : {}"
          @click="toggleTag(t.id)"
        >
          {{ t.name }}
        </button>
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">สถานะ</label>
          <select v-model="form.status" :class="inputClass">
            <option value="draft">แบบร่าง</option>
            <option value="published">เผยแพร่</option>
            <option value="pending">รออนุมัติ</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">ลำดับ</label>
          <input v-model.number="form.sort_order" type="number" min="0" :class="inputClass">
        </div>
        <div class="flex items-end pb-2">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.is_active" type="checkbox" class="rounded text-red-500">
            เปิดใช้งาน
          </label>
        </div>
      </div>
    </section>
  </div>
</template>
