const moneyFormatter = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const bahtCurrencyFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function toMoneyNumber(n: number | null | undefined) {
  const value = Number(n)
  if (n == null || Number.isNaN(value)) return null
  return value
}

/** ตัวเลขเงิน — ไม่ปัดเป็นจำนวนเต็ม คงทศนิยมได้สูงสุด 2 ตำแหน่ง (ตรง numeric(12,2)) */
export function formatMoneyAmount(n: number | null | undefined, fallback = '—') {
  const value = toMoneyNumber(n)
  if (value == null) return fallback
  return moneyFormatter.format(value)
}

/** สกุลเงินบาท — ไม่ปัดเป็นจำนวนเต็ม */
export function formatBaht(n: number | null | undefined, fallback = '—') {
  const value = toMoneyNumber(n)
  if (value == null) return fallback
  return bahtCurrencyFormatter.format(value)
}

/** ข้อความสั้น เช่น "1,234.50 บ." */
export function formatBahtPlain(n: number | null | undefined, fallback = '—') {
  const value = toMoneyNumber(n)
  if (value == null) return fallback
  return `${moneyFormatter.format(value)} บ.`
}

/** สำหรับ export CSV — ค่าว่างเมื่อไม่มีตัวเลข */
export function formatMoneyForExport(n: number | null | undefined) {
  const value = toMoneyNumber(n)
  if (value == null) return ''
  return moneyFormatter.format(value)
}
