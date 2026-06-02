import type { ComboProgramInput } from '~~/shared/types/comboProgram'
import { createComboProgram } from '~~/server/utils/comboProgramsDb'

export default defineEventHandler(async (event) => {
  const body = await readBody<ComboProgramInput>(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: 'กรุณากรอกชื่อโปรแกรม' })
  }
  if (!body.customer_segment || !['new', 'existing'].includes(body.customer_segment)) {
    throw createError({ statusCode: 400, message: 'กรุณาเลือกกลุ่มลูกค้า (ใหม่/เก่า)' })
  }

  const supabase = useSupabaseAdmin()
  try {
    return await createComboProgram(supabase, {
      ...body,
      name: body.name.trim(),
      tiers: body.tiers ?? [],
    })
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'สร้างโปรแกรม combo ไม่สำเร็จ'
    throw createError({ statusCode: 400, message })
  }
})
