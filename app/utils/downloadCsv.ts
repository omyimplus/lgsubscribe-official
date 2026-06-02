function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** ดาวน์โหลด CSV (UTF-8 BOM สำหรับ Excel ภาษาไทย) — ใช้ฝั่ง client เท่านั้น */
export function downloadCsv(filename: string, rows: (string | number | boolean | null | undefined)[][]) {
  if (!import.meta.client) return

  const bom = '\uFEFF'
  const body = rows.map(row => row.map(escapeCsvCell).join(',')).join('\n')
  const blob = new Blob([bom + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
