/** แต่ละแท็บ = 1 รายการ: ข้อความ (ชื่อแท็บ) + มูลค่า (บาท) */
export interface ProductSubscribeValueRow {
  text: string
  price: number
}

export function createEmptySubscribeValueRow(): ProductSubscribeValueRow {
  return { text: '', price: 0 }
}

function parseRow(raw: unknown): ProductSubscribeValueRow | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const text = typeof r.text === 'string' ? r.text.trim() : ''
  const price = Number(r.price)
  if (!text && (!Number.isFinite(price) || price === 0)) return null
  return {
    text,
    price: Number.isFinite(price) ? price : 0,
  }
}

/** รองรับรูปแบบเก่า { label, rows[] } โดยแปลงเป็นแท็บละ 1 แถว */
export function normalizeSubscribeValueTabs(raw: unknown): ProductSubscribeValueRow[] {
  if (!Array.isArray(raw)) return []

  const items: ProductSubscribeValueRow[] = []

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const obj = item as Record<string, unknown>

    if (Array.isArray(obj.rows)) {
      for (const row of obj.rows) {
        const parsed = parseRow(row)
        if (parsed) items.push(parsed)
      }
      const label = typeof obj.label === 'string' ? obj.label.trim() : ''
      if (label && !obj.rows.length) {
        items.push({ text: label, price: 0 })
      }
      continue
    }

    const parsed = parseRow(item)
    if (parsed) items.push(parsed)
  }

  return items
}

export function sumSubscribeValueItems(items: ProductSubscribeValueRow[]): number {
  return items.reduce((sum, row) => sum + (Number(row.price) || 0), 0)
}

export function hasSubscribeBenefitsImage(url: string | null | undefined): boolean {
  return Boolean(String(url ?? '').trim())
}

export function hasSubscribeValueTabs(items: ProductSubscribeValueRow[] | null | undefined): boolean {
  return Boolean(items?.some(item => item.text.trim() || item.price > 0))
}
