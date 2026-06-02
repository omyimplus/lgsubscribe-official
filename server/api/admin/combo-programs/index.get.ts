import { listComboPrograms } from '~~/server/utils/comboProgramsDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  try {
    return await listComboPrograms(supabase)
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'โหลดรายการ combo ไม่สำเร็จ'
    throw createError({ statusCode: 500, message })
  }
})
