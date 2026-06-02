import { fetchComboProgramById } from '~~/server/utils/comboProgramsDb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ต้องระบุ id' })

  const supabase = useSupabaseAdmin()
  const program = await fetchComboProgramById(supabase, id)
  if (!program) {
    throw createError({ statusCode: 404, message: 'ไม่พบโปรแกรม combo' })
  }
  return program
})
