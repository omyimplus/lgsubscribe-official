import tailwindcss from '@tailwindcss/vite'
import {
  SITE_LINE_OA_ID,
  SITE_LINE_OA_URL,
  SITE_LINE_QR_IMAGE,
} from './shared/utils/siteContact'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/icon'],

  routeRules: {
    '/admin/**': { ssr: false },
  },

  runtimeConfig: {
    // server-side only (ไม่ถูก expose ไปฝั่ง client)
    supabaseServiceRoleKey: process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY || '',
    lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    lineChannelSecret: process.env.LINE_CHANNEL_SECRET || '',
    lineNotifyUserIds: process.env.LINE_NOTIFY_USER_IDS || '',
    // public (เข้าถึงได้ทั้ง client และ server)
    public: {
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
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap',
        },
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
