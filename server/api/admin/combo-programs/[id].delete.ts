import { deleteComboProgram } from '~~/server/utils/comboProgramsDb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()
  try {
    await deleteComboProgram(supabase, id)
    return { ok: true }
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'ลบไม่สำเร็จ'
    throw createError({ statusCode: 400, message })
  }
})
