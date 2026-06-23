import tailwindcss from '@tailwindcss/vite'
import {
  SITE_LINE_OA_ID,
  SITE_LINE_OA_URL,
  SITE_LINE_QR_IMAGE,
} from './shared/utils/siteContact'

const PROMPT_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  modules: ['@nuxt/icon'],

  routeRules: {
    '/admin/**': { ssr: false },
    '/': { swr: 300 },
    '/products': { swr: 300 },
    '/products/**': { swr: 300 },
    '/promotions/**': { swr: 600 },
    '/articles/**': { swr: 600 },
    '/faq/**': { swr: 3600 },
    '/trust': { swr: 3600 },
    '/contact': { swr: 3600 },
    '/installment': { swr: 3600 },
    '/corporate': { swr: 3600 },
    '/experiences/**': { swr: 600 },
    '/api/public/products': { swr: 120 },
    '/api/public/home-categories': { swr: 600 },
    '/api/public/featured-products': { swr: 300 },
    '/api/public/promotions': { swr: 600 },
    '/api/public/articles/**': { swr: 600 },
    '/sitemap.xml': { swr: 3600 },
  },

  nitro: {
    compressPublicAssets: true,
  },

  runtimeConfig: {
    // server-side only (ไม่ถูก expose ไปฝั่ง client)
    supabaseServiceRoleKey: process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY || '',
    lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    lineChannelSecret: process.env.LINE_CHANNEL_SECRET || '',
    lineNotifyUserIds: process.env.LINE_NOTIFY_USER_IDS || '',
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
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'preload',
          as: 'style',
          href: PROMPT_FONT_URL,
        },
        {
          rel: 'stylesheet',
          href: PROMPT_FONT_URL,
          media: 'print',
          onload: 'this.media=\'all\'',
        },
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
