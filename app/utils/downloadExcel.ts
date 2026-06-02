export type ExcelSheetInput = {
  name: string
  rows: (string | number | boolean | null | undefined)[][]
}

/** ดาวน์โหลด .xlsx — ใช้ฝั่ง client เท่านั้น (dynamic import ลด bundle หน้าอื่น) */
export async function downloadExcel(
  filename: string,
  sheetName: string,
  rows: (string | number | boolean | null | undefined)[][],
) {
  await downloadExcelWorkbook(filename, [{ name: sheetName, rows }])
}

/** หลายชีตในไฟล์เดียว */
export async function downloadExcelWorkbook(filename: string, sheets: ExcelSheetInput[]) {
  if (!import.meta.client || !sheets.length) return

  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  for (const { name, rows } of sheets) {
    const sheet = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, sheet, name.slice(0, 31))
  }
  const out = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(workbook, out)
}
