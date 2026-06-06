<script setup lang="ts">
const {
  phones,
  officeAddress,
  lineOaUrl,
  lineOaIdDisplay,
  socialLinks,
  facebookUrl,
  tiktokUrl,
  tiktokHandle,
} = useSiteContact()

const productLinks = [
  { label: 'โทรทัศน์', to: '/products?category=television' },
  { label: 'เครื่องปรับอากาศ', to: '/products?category=air-conditioner' },
  { label: 'เครื่องซักผ้า', to: '/products?category=washing-machine' },
  { label: 'เครื่องอบผ้า', to: '/products?category=dryer' },
  { label: 'ตู้เย็น', to: '/products?category=refrigerator' },
  { label: 'เครื่องดูดฝุ่น', to: '/products?category=vacuum-cleaner' },
  { label: 'ไมโครเวฟ', to: '/products?category=microwave-oven' },
]

const helpLinks = [
  { label: 'คำถามที่พบบ่อย', to: '/faq' },
  { label: 'เงื่อนไขการผ่อน', to: '/installment' },
  { label: 'การรับประกัน', to: '/trust' },
  { label: 'ติดต่อเรา', to: '/contact' },
  { label: 'นโยบายความเป็นส่วนตัว', to: '/contact' },
]
</script>

<template>
  <footer class="border-t border-gray-100 bg-[#fafafa] text-gray-800">
    <div class="index-container py-10 sm:py-12">
      <div class="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div class="lg:col-span-4">
          <NuxtLink to="/" class="inline-block">
            <img
              src="/images/logo.webp"
              alt="LG Subscribe"
              class="block h-9 w-auto object-contain"
              width="160"
              height="36"
            >
          </NuxtLink>
          <p class="mt-4 max-w-md text-sm leading-relaxed text-gray-600">
            ข้อมูลในเวบไซต์ รวมถึงโปรโมชั่น แคมเปญต่างๆ ข้อความใดๆ อาจมีการตกหล่น ผิดพลาด หรือไม่อัพเดตล่าสุด ลูกค้าสามารถติดต่อเจ้าหน้าที่เพื่อขอรายละเอียดในสัญญาก่อนเซ็นเอกสารรับทราบ บริษัทฯขอสงวนสิทธิ์ในการเปลี่ยนแปลงหรือแห้ไขโดยไม่ต้องแจ้งให้ทราบล่วงหน้า และเงื่อนไขเป็นไปตามที่บริษัทฯ กำหนดเท่านั้น
          </p>
          <div class="mt-5 flex flex-wrap items-center gap-2.5">
            <a
              v-for="s in socialLinks"
              :key="s.label"
              :href="s.href"
              target="_blank"
              rel="noopener noreferrer"
              class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:border-gray-400 hover:text-gray-900"
              :aria-label="s.label"
            >
              <Icon :name="s.icon" class="h-5 w-5" />
            </a>
          </div>
        </div>

        <div class="flex flex-col gap-8 md:grid md:grid-cols-[9.5rem_auto_minmax(18rem,20rem)] md:items-start lg:col-span-8 lg:gap-10">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900">
              สินค้า
            </h3>
            <ul class="mt-4 space-y-2">
              <li v-for="link in productLinks" :key="link.to">
                <NuxtLink :to="link.to" class="text-sm text-gray-600 transition hover:text-[#ea1917]">
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="shrink-0">
            <h3 class="text-sm font-semibold text-gray-900">
              ช่วยเหลือ
            </h3>
            <ul class="mt-4 space-y-2">
              <li v-for="link in helpLinks" :key="link.label + link.to">
                <NuxtLink :to="link.to" class="text-sm text-gray-600 transition hover:text-[#ea1917]">
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900">
              ติดต่อ
            </h3>
            <ul class="mt-4 space-y-3 text-sm leading-relaxed text-gray-600">
              <li>
                <p>
                  {{ officeAddress }}
                </p>
              </li>
              <li v-for="phone in phones" :key="phone.tel">
                โทร.
                <a
                  :href="`tel:${phone.tel}`"
                  class="font-medium text-gray-900 hover:text-[#ea1917] hover:underline"
                >
                  {{ phone.display }}
                </a>
              </li>
              <li v-if="lineOaUrl">
                Line
                <a
                  :href="lineOaUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium text-[#06C755] hover:underline"
                >
                  {{ lineOaIdDisplay }}
                </a>
              </li>
              <li>
                <a
                  :href="facebookUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium text-gray-900 hover:text-[#ea1917] hover:underline"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  :href="tiktokUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium text-gray-900 hover:text-[#ea1917] hover:underline"
                >
                  TikTok {{ tiktokHandle }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-100 bg-[#f3f3f3]">
      <div class="index-container py-4">
        <p class="text-center text-xs text-gray-500 sm:text-left">
          © {{ new Date().getFullYear() }} LG Subscribe-Official. All Rights Reserved.
        </p>
      </div>
    </div>
  </footer>
</template>
