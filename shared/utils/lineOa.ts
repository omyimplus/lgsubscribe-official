/** Line Official Account — ID ชั่วคราวสำหรับ dev/demo */
export const DEFAULT_LINE_OA_ID = 'aisuru_oat'

export function normalizeLineOaId(raw: string): string {
  return raw.trim().replace(/^@/, '')
}

/** ลิงก์เพิ่มเพื่อนจาก Line ID (เช่น aisuru_oat → @aisuru_oat) */
export function lineOaAddFriendUrl(lineId: string): string {
  const id = normalizeLineOaId(lineId)
  if (!id) return ''
  return `https://line.me/R/ti/p/@${id}`
}

/** ใช้ URL จาก env ก่อน — ไม่มี URL จึงสร้างจาก Line ID (ค่าเริ่มต้น aisuru_oat) */
export function resolveLineOaUrl(explicitUrl?: string, lineId?: string): string {
  const url = String(explicitUrl ?? '').trim()
  if (url) return url
  const id = normalizeLineOaId(String(lineId ?? '')) || DEFAULT_LINE_OA_ID
  return lineOaAddFriendUrl(id)
}

export function formatLineOaIdDisplay(lineId?: string): string {
  const id = normalizeLineOaId(String(lineId ?? '')) || DEFAULT_LINE_OA_ID
  return `@${id}`
}
