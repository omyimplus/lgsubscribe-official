/** มีเนื้อหาแสดงได้จริงใน HTML จาก editor / import LG (ไม่นับแท็กว่างหรือ "-" อย่างเดียว) */
export function hasRichHtmlContent(html: string | null | undefined): boolean {
  const raw = html?.trim()
  if (!raw) return false

  if (/<img[\s>][^>]*\ssrc=["'][^"'\s]+["']/i.test(raw)) return true
  if (/<video[\s>]/i.test(raw)) return true
  if (/<iframe[\s>]/i.test(raw)) return true
  if (/<source[\s>][^>]*\ssrc=["'][^"'\s]+["']/i.test(raw)) return true

  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|td|th|tr|section|article)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) return false
  if (/^[-–—•·.\s]+$/.test(text)) return false
  return true
}
