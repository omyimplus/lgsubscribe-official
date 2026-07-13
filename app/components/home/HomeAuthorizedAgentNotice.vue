<script setup lang="ts">
import {
  SITE_AUTHORIZED_AGENT,
  SITE_OFFICE_ADDRESS,
  SITE_OFFICE_COMPANY_NAME,
  SITE_OFFICE_COMPANY_NAME_EN,
  SITE_STORE_ADDRESS,
  SITE_STORE_NAME,
} from '~~/shared/utils/siteContact'

const agent = SITE_AUTHORIZED_AGENT
</script>

<template>
  <section
    class="border-t border-gray-200 bg-[#f7f7f8]"
    aria-label="ข้อมูลผู้บริหารจัดการเว็บไซต์และตัวแทนแต่งตั้ง"
  >
    <div class="index-container py-5 text-center sm:py-6">
      <p class="text-base font-bold tracking-wide text-[#ea1917] sm:text-lg md:text-xl">
        Website นี้บริหารจัดการโดย
      </p>
      <p class="mt-2 text-sm font-semibold leading-snug text-gray-900 sm:text-base">
        {{ agent.operatorName }}
        <span class="font-medium text-gray-700">
          — {{ agent.roleTitle }}
          <span class="whitespace-nowrap">{{ agent.salesCode }}</span>
          รหัสตัวแทนขาย
          <span class="whitespace-nowrap">{{ agent.agentCode }}</span>
        </span>
      </p>

      <p class="mx-auto mt-3 max-w-3xl text-xs font-semibold text-gray-800 sm:text-sm">
        ที่อยู่ร้าน: {{ SITE_STORE_NAME }}
      </p>
      <p class="mx-auto mt-1 max-w-3xl text-xs leading-relaxed text-gray-600 sm:text-[13px]">
        {{ SITE_STORE_ADDRESS }}
      </p>

      <p class="mx-auto mt-3 max-w-3xl text-xs leading-relaxed text-gray-600 sm:text-sm">
        ตัวแทนแต่งตั้งอย่างเป็นทางการจาก
        <span class="font-medium text-gray-800">{{ SITE_OFFICE_COMPANY_NAME }}</span>
        <span class="text-gray-500"> ({{ SITE_OFFICE_COMPANY_NAME_EN }})</span>
      </p>
      <p class="mx-auto mt-1 max-w-3xl text-xs leading-relaxed text-gray-500 sm:text-[13px]">
        ที่อยู่บริษัท: {{ SITE_OFFICE_ADDRESS }}
      </p>
      <p class="mx-auto mt-2.5 max-w-3xl text-[11px] leading-relaxed text-gray-500 sm:text-xs">
        เว็บไซต์นี้เป็นช่องทางของตัวแทนจำหน่าย LG Subscribe ที่ได้รับแต่งตั้ง
        ไม่ใช่เว็บไซต์ทางการของบริษัทผู้ผลิต
      </p>
    </div>
  </section>
</template>
