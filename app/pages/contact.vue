<script setup lang="ts">
import { SEO_CONTACT } from '~~/shared/utils/siteSeoPresets'
import { buildLocalBusinessJsonLd } from '~~/shared/utils/siteSeoJsonLd'

definePageMeta({
  layout: 'default',
  showHero: false,
  breadcrumb: [
    { label: 'หน้าแรก', to: '/' },
    { label: 'ติดต่อเรา' },
  ],
})

const {
  phones,
  phonesDisplay,
  businessHours,
  storeName,
  storeAddress,
  lineOaUrl,
  lineOaIdDisplay,
  lineQrImage,
  facebookUrl,
  facebookHandle,
  tiktokUrl,
  tiktokHandle,
} = useSiteContact()

const {
  useStaticQr,
  qrDataUrl,
  qrLoading,
  qrError,
} = useLineOaQr()

const quickLinks = [
  {
    title: 'คำถามที่พบบ่อย',
    description: 'ดูคำตอบหัวข้อยอดนิยมก่อนติดต่อทีมงาน',
    to: '/faq',
    icon: 'heroicons:question-mark-circle',
  },
  {
    title: 'สนใจผ่อน / สมัคร Subscribe',
    description: 'เลือกสินค้าแล้วส่งรายการให้ทีมติดต่อกลับ',
    to: '/subscribe/inquiry',
    icon: 'heroicons:clipboard-document-check',
  },
  {
    title: 'เลือกดูสินค้า',
    description: 'เครื่องใช้ไฟฟ้า LG ทุกหมวด พร้อมแผนรายเดือน',
    to: '/products',
    icon: 'heroicons:shopping-bag',
  },
]

const siteUrl = useSiteUrl()

useSiteSeoFromPreset(SEO_CONTACT, {
  schema: {
    pageType: 'ContactPage',
    breadcrumbs: [
      { name: 'หน้าแรก', path: '/' },
      { name: 'ติดต่อเรา' },
    ],
  },
  jsonLd: computed(() => buildLocalBusinessJsonLd(siteUrl.value)),
  description: () =>
    `ติดต่อ LG Subscribe — โทร ${phonesDisplay} หรือ Line ${lineOaIdDisplay.value} ${businessHours}`,
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <section class="border-b border-gray-100 bg-white">
      <div class="index-container py-10 sm:py-14">
        <p class="text-sm font-semibold tracking-wide text-[#ea1917]">
          ช่วยเหลือและติดต่อ
        </p>
        <h1 class="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
          ติดต่อเรา
        </h1>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
          ทีมงาน LG Subscribe พร้อมให้คำปรึกษาเรื่องสมัครใช้เครื่องใช้ไฟฟ้าแบบรายเดือน โปรโมชั่น และเงื่อนไขผ่อน — โทรหรือทัก Line ได้ทุกวัน
        </p>
        <div
          class="mt-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700"
        >
          <Icon name="heroicons:clock" class="h-5 w-5 shrink-0 text-[#ea1917]" />
          <span>{{ businessHours }}</span>
        </div>
      </div>
    </section>

    <main class="index-container py-10 sm:py-12">
      <!-- ซ้าย: ช่องทางติดต่อ | ขวา: QR Line -->
      <div class="grid gap-6 lg:grid-cols-2 lg:gap-8 lg:items-stretch">
        <div class="flex flex-col gap-6">
          <article class="product-storefront-card flex flex-col p-6 sm:p-8">
            <div class="flex items-start gap-4">
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#ea1917]/10 text-[#ea1917]"
                aria-hidden="true"
              >
                <Icon name="heroicons:phone" class="h-7 w-7" />
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="text-lg font-bold text-gray-900 sm:text-xl">
                  โทรศัพท์
                </h2>
                <p class="mt-1 text-sm leading-relaxed text-gray-600">
                  พูดคุยกับเจ้าหน้าที่โดยตรง — เหมาะสำหรับเรื่องเร่งด่วนหรือต้องการคำแนะนำทันที
                </p>
              </div>
            </div>
            <div class="mt-6 space-y-3">
              <a
                v-for="phone in phones"
                :key="phone.tel"
                :href="`tel:${phone.tel}`"
                class="block rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-center transition hover:border-[#ea1917]/30 hover:bg-white hover:shadow-[0_4px_20px_rgba(234,25,23,0.08)]"
              >
                <span class="block text-xs font-medium uppercase tracking-wider text-gray-500">
                  กดโทร
                </span>
                <span class="mt-1 block text-2xl font-bold tracking-tight text-[#ea1917] sm:text-3xl">
                  {{ phone.display }}
                </span>
              </a>
            </div>
            <p class="mt-4 text-center text-xs text-gray-500 sm:text-sm">
              คลิกหมายเลขบนมือถือเพื่อโทรออกทันที
            </p>
          </article>

          <article class="product-storefront-card flex flex-1 flex-col p-6 sm:p-8">
            <div class="flex items-start gap-4">
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#06C755]/15 text-[#06C755]"
                aria-hidden="true"
              >
                <Icon name="mdi:chat" class="h-7 w-7" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold uppercase tracking-wide text-[#06C755]">
                  Line
                </p>
                <h2 class="mt-0.5 text-lg font-bold text-gray-900 sm:text-xl">
                  ทักแชทสะดวกที่สุด
                </h2>
                <p class="mt-1 text-sm leading-relaxed text-gray-600">
                  สอบถามโปรโมชั่น เงื่อนไขผ่อน และรายละเอียดสินค้า — สแกน QR ด้านขวาหรือกดปุ่มด้านล่าง
                </p>
              </div>
            </div>
            <ul class="mt-5 space-y-2.5 text-sm text-gray-700">
              <li class="flex gap-2.5">
                <Icon name="heroicons:check-circle" class="mt-0.5 h-5 w-5 shrink-0 text-[#06C755]" />
                <span>รับข่าวโปรและสิทธิพิเศษจาก LG Subscribe</span>
              </li>
              <li class="flex gap-2.5">
                <Icon name="heroicons:check-circle" class="mt-0.5 h-5 w-5 shrink-0 text-[#06C755]" />
                <span>เช็คแผนรายเดือน / รายปีก่อนตัดสินใจ</span>
              </li>
            </ul>
            <a
              v-if="lineOaUrl"
              :href="lineOaUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#06C755] px-5 py-3 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(6,199,85,0.35)] transition hover:bg-[#05b34c] hover:shadow-[0_3px_12px_rgba(6,199,85,0.4)] sm:w-auto sm:self-start"
            >
              <Icon name="mdi:chat" class="h-5 w-5 shrink-0" />
              เพิ่ม Line เพื่อสอบถาม
            </a>
            <p v-else class="mt-6 text-sm text-gray-500">
              ช่องทาง Line กำลังเปิดให้บริการ — โปรดติดต่อทางโทรศัพท์ในขณะนี้
            </p>
          </article>
        </div>

        <article
          class="product-storefront-card flex flex-col items-center justify-center p-6 text-center sm:p-8 lg:min-h-full"
        >
          <p class="text-xs font-semibold uppercase tracking-wide text-[#06C755]">
            บัญชี Line
          </p>
          <h2 class="mt-1 text-lg font-bold text-gray-900 sm:text-xl">
            สแกน QR Code
          </h2>
          <p class="mt-2 max-w-xs text-sm leading-relaxed text-gray-600">
            เปิดแอป Line แล้วสแกนเพื่อเพิ่มเพื่อน LG Subscribe
          </p>

          <div
            class="mt-6 flex w-full max-w-[280px] min-h-[240px] items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:max-w-[300px] sm:p-5"
          >
            <img
              v-if="useStaticQr"
              :src="lineQrImage"
              alt="QR Code Line LG Subscribe"
              width="240"
              height="240"
              class="h-auto w-full max-w-[240px] object-contain"
              loading="lazy"
            >
            <img
              v-else-if="qrDataUrl"
              :src="qrDataUrl"
              alt="QR Code Line LG Subscribe"
              width="240"
              height="240"
              class="h-auto w-full max-w-[240px] object-contain"
            >
            <div
              v-else-if="qrLoading"
              class="flex aspect-square w-full max-w-[240px] flex-col items-center justify-center text-gray-400"
            >
              <Icon name="heroicons:arrow-path" class="h-10 w-10 animate-spin" />
              <p class="mt-3 text-sm">
                กำลังสร้าง QR...
              </p>
            </div>
            <div
              v-else
              class="flex aspect-square w-full max-w-[240px] flex-col items-center justify-center rounded-xl bg-gray-50 px-4 py-8 text-gray-500"
            >
              <Icon name="heroicons:qr-code" class="h-14 w-14 text-gray-300" />
              <p class="mt-3 text-sm">
                {{ qrError ? 'สร้าง QR ไม่สำเร็จ' : 'ไม่พบลิงก์ Line' }}
              </p>
            </div>
          </div>

          <p class="mt-5 text-sm font-semibold text-gray-800">
            {{ lineOaIdDisplay }}
          </p>
          <p class="mt-1 text-xs text-gray-500 sm:text-sm">
            บัญชี Line
          </p>
          <a
            v-if="lineOaUrl"
            :href="lineOaUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 text-sm font-medium text-[#06C755] hover:underline"
          >
            หรือเปิดลิงก์เพิ่มเพื่อนใน Line
          </a>
        </article>
      </div>

      <section class="mt-10">
        <article class="product-storefront-card p-6 sm:p-8">
          <div class="flex items-start gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1e3354]/10 text-[#1e3354]"
              aria-hidden="true"
            >
              <Icon name="heroicons:map-pin" class="h-7 w-7" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-lg font-bold text-gray-900 sm:text-xl">
                {{ storeName }}
              </h2>
              <p class="mt-3 text-sm leading-relaxed text-gray-700 sm:text-base">
                {{ storeAddress }}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section class="mt-10">
        <h2 class="text-lg font-bold text-gray-900 sm:text-xl">
          โซเชียลมีเดีย
        </h2>
        <p class="mt-1 text-sm text-gray-600">
          ติดตามข่าวสารและโปรโมชั่น LG Subscribe
        </p>
        <ul class="mt-5 grid gap-4 sm:grid-cols-3">
          <li>
            <a
              :href="facebookUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex h-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,0.06)] transition hover:border-[#ea1917]/25 hover:shadow-[0_6px_24px_rgba(234,25,23,0.1)]"
            >
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1877F2]/10 text-[#1877F2]">
                <Icon name="mdi:facebook" class="h-6 w-6" />
              </div>
              <div>
                <p class="font-semibold text-gray-900 group-hover:text-[#ea1917]">Facebook</p>
                <p class="text-sm text-gray-600">{{ facebookHandle }}</p>
              </div>
            </a>
          </li>
          <li>
            <a
              :href="tiktokUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex h-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,0.06)] transition hover:border-[#ea1917]/25 hover:shadow-[0_6px_24px_rgba(234,25,23,0.1)]"
            >
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-900/10 text-gray-900">
                <SiteTiktokIcon class="h-6 w-6" />
              </div>
              <div>
                <p class="font-semibold text-gray-900 group-hover:text-[#ea1917]">TikTok</p>
                <p class="text-sm text-gray-600">{{ tiktokHandle }}</p>
              </div>
            </a>
          </li>
          <li v-if="lineOaUrl">
            <a
              :href="lineOaUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex h-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,0.06)] transition hover:border-[#06C755]/30 hover:shadow-[0_6px_24px_rgba(6,199,85,0.12)]"
            >
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#06C755]/15 text-[#06C755]">
                <Icon name="mdi:chat" class="h-6 w-6" />
              </div>
              <div>
                <p class="font-semibold text-gray-900 group-hover:text-[#06C755]">Line OA</p>
                <p class="text-sm text-gray-600">{{ lineOaIdDisplay }}</p>
              </div>
            </a>
          </li>
        </ul>
      </section>

      <section class="mt-12 sm:mt-14">
        <h2 class="text-lg font-bold text-gray-900 sm:text-xl">
          ช่วยเหลือเพิ่มเติม
        </h2>
        <p class="mt-1 text-sm text-gray-600">
          ลองหาคำตอบหรือเริ่มจากหน้าเหล่านี้ก่อนติดต่อทีมงาน
        </p>
        <ul class="mt-6 grid gap-4 sm:grid-cols-3">
          <li v-for="link in quickLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,0.06)] transition hover:border-[#ea1917]/25 hover:shadow-[0_6px_24px_rgba(234,25,23,0.1)]"
            >
              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-[#ea1917] transition group-hover:bg-[#ea1917]/10"
              >
                <Icon :name="link.icon" class="h-6 w-6" />
              </div>
              <h3 class="mt-4 font-semibold text-gray-900 group-hover:text-[#ea1917]">
                {{ link.title }}
              </h3>
              <p class="mt-1.5 flex-1 text-sm leading-relaxed text-gray-600">
                {{ link.description }}
              </p>
              <span class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#ea1917]">
                ไปที่หน้านี้
                <Icon name="heroicons:arrow-right" class="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <p class="mt-10 text-center text-sm text-gray-500">
        ดูเรื่อง
        <NuxtLink to="/trust" class="font-medium text-[#ea1917] hover:underline">
          ความน่าเชื่อถือและการรับประกัน
        </NuxtLink>
        หรือ
        <NuxtLink to="/installment" class="font-medium text-[#ea1917] hover:underline">
          ข้อกำหนดและเงื่อนไขให้บริการ
        </NuxtLink>
      </p>
    </main>
  </div>
</template>
