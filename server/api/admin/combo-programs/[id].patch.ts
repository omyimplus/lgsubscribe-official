import type { ComboProgramInput } from '~~/shared/types/comboProgram'
import { updateComboProgram } from '~~/server/utils/comboProgramsDb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const body = await readBody<Partial<ComboProgramInput>>(event)

  if (body.name !== undefined && !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'ชื่อโปรแกรมต้องไม่ว่าง' })
  }

  const supabase = useSupabaseAdmin()
  try {
    return await updateComboProgram(supabase, id, body)
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ'
    if (message === 'NOT_FOUND') {
      throw createError({ statusCode: 404, message: 'ไม่พบโปรแกรม combo' })
    }
    throw createError({ statusCode: 400, message })
  }
})
