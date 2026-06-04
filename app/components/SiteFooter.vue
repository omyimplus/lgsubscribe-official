<script setup lang="ts">
const { lineOaUrl } = useLineOa()

const productLinks = [
  { label: 'โทรทัศน์', to: '/products?category=television' },
  { label: 'เครื่องปรับอากาศ', to: '/products?category=air-conditioner' },
  { label: 'เครื่องซักผ้า', to: '/products?category=washing-machine' },
  { label: 'เครื่องอบผ้า', to: '/products?category=dryer' },
  { label: 'ตู้เย็น', to: '/products?category=refrigerator' },
  { label: 'เครื่องดูดฝุ่น', to: '/products?category=vacuum-cleaner' },
  { label: 'ไมโครเวฟ', to: '/products?category=microwave-oven' },
]

const serviceLinks = [
  { label: 'การรับประกัน', to: '/trust' },
  { label: 'บริการถึงบ้าน', to: '/contact' },
]

const helpLinks = [
  { label: 'คำถามที่พบบ่อย', to: '/faq' },
  { label: 'ติดต่อเรา', to: '/contact' },
  { label: 'นโยบายความเป็นส่วนตัว', to: '/contact' },
]

const socialLinks = computed(() => [
  { label: 'Facebook', href: 'https://www.facebook.com/lgthailand', icon: 'mdi:facebook' },
  ...(lineOaUrl.value ? [{ label: 'Line', href: lineOaUrl.value, icon: 'mdi:chat' }] : []),
  { label: 'Instagram', href: 'https://www.instagram.com/lgthailand/', icon: 'mdi:instagram' },
  { label: 'YouTube', href: 'https://www.youtube.com/user/LGThailand', icon: 'mdi:youtube' },
])
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
          <p class="mt-4 max-w-sm text-sm leading-relaxed text-gray-600">
            เป็นเจ้าของ LG ง่ายกว่าใคร — สมัครใช้เครื่องใช้ไฟฟ้า LG แบบรายเดือน เริ่มต้นเพียงหลักร้อย จ่ายง่ายผ่อนสบาย
          </p>
          <div class="mt-5 flex items-center gap-2.5">
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

        <div class="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
          <div>
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

          <div>
            <h3 class="text-sm font-semibold text-gray-900">
              บริการ
            </h3>
            <ul class="mt-4 space-y-2">
              <li v-for="link in serviceLinks" :key="link.to">
                <NuxtLink :to="link.to" class="text-sm text-gray-600 transition hover:text-[#ea1917]">
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div>
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

          <div>
            <h3 class="text-sm font-semibold text-gray-900">
              ติดต่อ
            </h3>
            <ul class="mt-4 space-y-2 text-sm text-gray-600">
              <li>
                โทร.
                <a href="tel:020575757" class="font-medium text-gray-900 hover:text-[#ea1917] hover:underline">
                  02-057-5757
                </a>
              </li>
              <li>จันทร์–อาทิตย์ 09:00–20:00 น.</li>
              <li v-if="lineOaUrl">
                Line
                <a
                  :href="lineOaUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium text-[#06C755] hover:underline"
                >
                  @lgsubscribe
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
