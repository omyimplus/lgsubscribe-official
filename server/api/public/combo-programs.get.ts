import { listPublishedComboPrograms } from '~~/server/utils/comboProgramsDb'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  try {
    const programs = await listPublishedComboPrograms(supabase)
    return { programs }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'โหลดโปร combo ไม่สำเร็จ'
    throw createError({ statusCode: 500, message })
  }
})
