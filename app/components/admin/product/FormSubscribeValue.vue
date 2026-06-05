<script setup lang="ts">
import { PRODUCT_FORM_KEY } from './form-context'

const ctx = inject(PRODUCT_FORM_KEY)
if (!ctx) throw new Error('ProductFormSubscribeValue must be used inside product form page')

const {
  form,
  inputClass,
  btnSecondaryClass,
  uploadingSubscribeImage,
  uploadSubscribeBenefitsImage,
  removeSubscribeBenefitsImage,
  addSubscribeValueTab,
  removeSubscribeValueTab,
} = ctx

const subscribeImageInput = ref<HTMLInputElement | null>(null)

function triggerSubscribeImageInput() {
  subscribeImageInput.value?.click()
}

async function onSubscribeImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  await uploadSubscribeBenefitsImage(file)
  if (subscribeImageInput.value) subscribeImageInput.value.value = ''
}
</script>

<template>
  <section class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
    <h3 class="text-sm font-semibold text-gray-800">
      Subscribe — มูลค่าเพิ่ม
    </h3>
    <p class="mt-1 text-xs text-gray-500">
      รูป + แท็บบน PDP (แต่ละแท็บ = ข้อความ 1 ช่อง + มูลค่า 1 ช่อง)
    </p>

    <div class="mt-5 space-y-3">
      <label class="block text-xs font-medium text-gray-600">
        รูป Subscribe
      </label>

      <div
        v-if="form.subscribe_benefits_image_url"
        class="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
      >
        <img
          :src="form.subscribe_benefits_image_url"
          alt="Subscribe benefits"
          class="max-h-64 w-full object-contain"
        >
        <div class="flex flex-wrap gap-2 border-t border-gray-200 bg-white p-3">
          <button type="button" :class="btnSecondaryClass" @click="triggerSubscribeImageInput">
            เปลี่ยนรูป
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            @click="removeSubscribeBenefitsImage"
          >
            ลบรูป
          </button>
        </div>
      </div>

      <button
        v-else
        type="button"
        class="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-600 transition hover:border-red-300 hover:bg-red-50/40"
        :disabled="uploadingSubscribeImage"
        @click="triggerSubscribeImageInput"
      >
        <Icon name="heroicons:photo" class="h-8 w-8 text-gray-400" />
        {{ uploadingSubscribeImage ? 'กำลังอัพโหลด...' : 'อัพโหลดรูป' }}
      </button>

      <input
        ref="subscribeImageInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onSubscribeImageChange"
      >
    </div>

    <div class="mt-8 border-t border-gray-100 pt-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-gray-500">
          ตัวอย่างแท็บ: 「รับประกัน 7 ปี」 → มูลค่า 8,000 บาท
        </p>
        <button type="button" :class="btnSecondaryClass" @click="addSubscribeValueTab">
          <Icon name="heroicons:plus" class="h-4 w-4" />
          เพิ่มแท็บ
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="(item, index) in form.subscribe_value_tabs"
          :key="index"
          class="grid gap-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:grid-cols-[1fr_8rem_auto]"
        >
          <input
            v-model="item.text"
            type="text"
            placeholder="ข้อความ เช่น รับประกัน 7 ปี"
            :class="inputClass"
          >
          <input
            v-model.number="item.price"
            type="number"
            min="0"
            step="0.01"
            placeholder="มูลค่า (บาท)"
            :class="inputClass"
          >
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-red-600"
            aria-label="ลบแท็บ"
            @click="removeSubscribeValueTab(index)"
          >
            <Icon name="heroicons:trash" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
