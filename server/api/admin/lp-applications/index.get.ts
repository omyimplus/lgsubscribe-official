import type { LpApplication } from '~~/shared/types/lpApplication'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()

  const { data, error } = await supabase
    .from('lp_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []) as LpApplication[]
})
