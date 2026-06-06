import { SITE_LINE_OA_ID, SITE_LINE_OA_URL } from './siteContact'

export const DEFAULT_LINE_OA_ID = SITE_LINE_OA_ID
export const DEFAULT_LINE_OA_URL = SITE_LINE_OA_URL

export function normalizeLineOaId(raw: string): string {
  return raw.trim().replace(/^@/, '')
}

/** ลิงก์เพิ่มเพื่อนจาก Line ID (เช่น aisuru_oat → @aisuru_oat) */
export function lineOaAddFriendUrl(lineId: string): string {
  const id = normalizeLineOaId(lineId)
  if (!id) return ''
  return `https://line.me/R/ti/p/@${id}`
}

/** ใช้ URL จาก env ก่อน — ไม่มี URL ใช้ lin.ee / Line ID เริ่มต้น */
export function resolveLineOaUrl(explicitUrl?: string, lineId?: string): string {
  const url = String(explicitUrl ?? '').trim()
  if (url) return url
  if (DEFAULT_LINE_OA_URL) return DEFAULT_LINE_OA_URL
  const id = normalizeLineOaId(String(lineId ?? '')) || DEFAULT_LINE_OA_ID
  return lineOaAddFriendUrl(id)
}

export function formatLineOaIdDisplay(lineId?: string): string {
  const id = normalizeLineOaId(String(lineId ?? '')) || DEFAULT_LINE_OA_ID
  return `@${id}`
}
