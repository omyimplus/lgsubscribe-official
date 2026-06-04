import { isProtectedSystemTag } from '~~/shared/utils/homeFeatured'

type TagRow = { slug?: string | null, name?: string | null }

export async function fetchTagRowById(supabase: ReturnType<typeof useSupabaseAdmin>, id: string) {
  const { data, error } = await supabase
    .from('tags')
    .select('id, slug, name')
    .eq('id', id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 400, message: error.message })
  return data as (TagRow & { id: string }) | null
}

export function assertTagCanDelete(tag: TagRow | null) {
  if (tag && isProtectedSystemTag(tag)) {
    throw createError({
      statusCode: 403,
      message: 'ไม่สามารถลบแท็กระบบ «สินค้าแนะนำ» (home-featured) — ใช้สำหรับหน้าแรก',
    })
  }
}

/** แท็กระบบ — รับเฉพาะสี/ลำดับ (ไม่รับชื่อ slug ปิดใช้งาน) */
export function filterSystemTagPatchBody(tag: TagRow | null, body: Record<string, unknown>) {
  if (!tag || !isProtectedSystemTag(tag)) return body

  const allowed: Record<string, unknown> = {}
  if (body.color !== undefined) allowed.color = body.color
  if (body.sort_order !== undefined) allowed.sort_order = body.sort_order
  return allowed
}
