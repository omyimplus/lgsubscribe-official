import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

export function useSupabaseAdmin() {
  const config = useRuntimeConfig()

  if (!config.public.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      message: 'Supabase ยังไม่ได้ตั้งค่า — ตรวจสอบไฟล์ .env',
    })
  }

  return createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: ws,
      },
    },
  )
}
