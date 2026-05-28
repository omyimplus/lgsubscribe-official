import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/icon'],

  runtimeConfig: {
    // server-side only (ไม่ถูก expose ไปฝั่ง client)
    supabaseServiceRoleKey: '',
    // public (เข้าถึงได้ทั้ง client และ server)
    public: {
      supabaseUrl: '',
      supabaseAnonKey: '',
    },
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()]
  }
})
