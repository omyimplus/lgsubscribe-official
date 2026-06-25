import tailwindcss from '@tailwindcss/vite'
import {
  SITE_LINE_OA_ID,
  SITE_LINE_OA_URL,
  SITE_LINE_QR_IMAGE,
} from './shared/utils/siteContact'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  modules: ['@nuxt/icon'],

  icon: {
    serverBundle: {
      collections: ['heroicons', 'mdi', 'simple-icons'],
    },
    clientBundle: {
      scan: true,
      sizeLimitKb: 512,
    },
  },

  routeRules: {
    '/admin/**': { ssr: false },
  },

  nitro: {
    compressPublicAssets: true,
  },

  runtimeConfig: {
    // server-side only (ไม่ถูก expose ไปฝั่ง client)
    supabaseServiceRoleKey: process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY || '',
    lineChannelId: process.env.NUXT_LINE_CHANNEL_ID || '',
    lineChannelAccessToken:
      process.env.NUXT_LINE_CHANNEL_ACCESS_TOKEN
      || process.env.LINE_CHANNEL_ACCESS_TOKEN
      || '',
    lineChannelSecret:
      process.env.NUXT_LINE_CHANNEL_SECRET
      || process.env.LINE_CHANNEL_SECRET
      || '',
    lineNotifyUserIds:
      process.env.NUXT_LINE_NOTIFY_USER_ID
      || process.env.LINE_NOTIFY_USER_IDS
      || '',
    // public (เข้าถึงได้ทั้ง client และ server)
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
      googleSiteVerification: process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
      lineOaUrl: process.env.NUXT_PUBLIC_LINE_OA_URL || SITE_LINE_OA_URL,
      lineOaId: process.env.NUXT_PUBLIC_LINE_OA_ID || SITE_LINE_OA_ID,
      lineOaQrImage: process.env.NUXT_PUBLIC_LINE_OA_QR_IMAGE || SITE_LINE_QR_IMAGE,
    },
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'th' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      meta: [
        { name: 'theme-color', content: '#ea1917' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
    },
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['tinymce', '@tinymce/tinymce-vue', 'qrcode'],
    },
  },
})
