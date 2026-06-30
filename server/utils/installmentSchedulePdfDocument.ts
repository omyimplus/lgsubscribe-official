import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'
import type PDFKit from 'pdfkit'
import { fetchProductImagesForPdf } from '~~/server/utils/pdfProductImage'
import type { CartPdfSummary } from '~~/shared/utils/cartPdfSummary'
import {
  formatSubscribeTotalForPdf,
  formatSubscribeValueForPdf,
} from '~~/shared/utils/cartPdfSummary'
import type { InstallmentSchedule } from '~~/shared/utils/installmentSchedule'
import { buildScheduleCellHtmlLines } from '~~/shared/utils/installmentScheduleCellDisplay'
import { formatMoneyAmount } from '~~/shared/utils/moneyFormat'

const PAGE_LAYOUT: 'landscape' | 'portrait' = 'landscape'
const MARGIN = 28
const HEADER_BG = '#1e3354'
const SUBHEAD_BG = '#243b5c'
const ACCENT = '#ea1917'
const PRODUCT_IMAGE_MAX_HEIGHT = 40
/** จำนวนสินค้าสูงสุดต่อตารางใน PDF */
const COLUMNS_PER_TABLE = 4

function resolveFontFile(name: string) {
  const moduleDir = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    join(process.cwd(), 'server/assets/fonts', name),
    join(process.cwd(), '.output/server/chunks/raw/fonts', name),
    join(moduleDir, '../assets/fonts', name),
    join(moduleDir, '../../assets/fonts', name),
  ]
  for (const path of candidates) {
    if (existsSync(path)) return path
  }
  throw new Error(`ไม่พบไฟล์ฟอนต์ ${name} — ตรวจสอบ server/assets/fonts/`)
}

function formatPrice(n: number) {
  return formatMoneyAmount(n, '0')
}

function chunkColumnIndices(total: number, size: number) {
  const chunks: number[][] = []
  for (let i = 0; i < total; i += size) {
    chunks.push(Array.from(
      { length: Math.min(size, total - i) },
      (_, j) => i + j,
    ))
  }
  return chunks
}

function drawCellText(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  lines: ReturnType<typeof buildScheduleCellHtmlLines>,
) {
  let cursorY = y + 4
  const padX = 4
  for (const line of lines) {
    const isPrice = line.className === 'price'
    const isMuted = line.className === 'muted'
    const isAccent = line.className === 'accent-sub'
    doc.font(isPrice ? 'Bold' : 'Regular')
    doc.fillColor(isPrice || isAccent ? ACCENT : isMuted ? '#d1d5db' : '#4b5563')
    doc.fontSize(isPrice ? 10 : 7.5)
    const h = doc.heightOfString(line.text, { width: width - padX * 2 })
    doc.text(line.text, x + padX, cursorY, { width: width - padX * 2, align: 'center' })
    cursorY += h + 1
  }
  syncDocY(doc, y)
}

function measureCellHeight(
  doc: PDFKit.PDFDocument,
  width: number,
  lines: ReturnType<typeof buildScheduleCellHtmlLines>,
) {
  let height = 8
  for (const line of lines) {
    const isPrice = line.className === 'price'
    doc.font(isPrice ? 'Bold' : 'Regular')
    doc.fontSize(isPrice ? 10 : 7.5)
    height += doc.heightOfString(line.text, { width: width - 8 }) + 1
  }
  return Math.max(height, 28)
}

function drawProductHeaderCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  col: InstallmentSchedule['columns'][number],
  image: Buffer | null,
) {
  doc.rect(x, y, width, height).fill(HEADER_BG)

  let textY = y + 5
  if (image) {
    const pad = 4
    doc.image(image, x + pad, y + 4, {
      fit: [width - pad * 2, PRODUCT_IMAGE_MAX_HEIGHT],
      align: 'center',
      valign: 'center',
    })
    textY = y + PRODUCT_IMAGE_MAX_HEIGHT + 8
  }

  doc.font('SemiBold').fontSize(7).fillColor('#ffffff')
  const skuSpace = 10
  const nameMaxHeight = Math.max(12, y + height - textY - skuSpace - (col.quantity > 1 ? 10 : 0))
  doc.text(col.name, x + 3, textY, {
    width: width - 6,
    align: 'center',
    height: nameMaxHeight,
    ellipsis: true,
    lineGap: 0,
  })

  let afterNameY = doc.y + 2
  if (col.quantity > 1) {
    doc.font('SemiBold').fontSize(7).fillColor('#fde68a')
    doc.text(`×${col.quantity} ชิ้น`, x + 3, afterNameY, { width: width - 6, align: 'center' })
    afterNameY = doc.y + 1
  }

  doc.font('Regular').fontSize(6.5).fillColor('#e5e7eb')
  doc.text(col.sku, x + 3, afterNameY, { width: width - 6, align: 'center' })
}

type TableLayout = {
  labelColWidth: number
  totalColWidth: number
  productColWidth: number
  tableWidth: number
  pageWidth: number
}

function computeTableLayout(doc: PDFKit.PDFDocument, _productCount: number): TableLayout {
  const pageWidth = doc.page.width - MARGIN * 2
  const labelColWidth = 72
  const totalColWidth = 58
  const productColWidth = Math.max(
    80,
    (pageWidth - labelColWidth - totalColWidth) / COLUMNS_PER_TABLE,
  )
  const tableWidth = labelColWidth + productColWidth * COLUMNS_PER_TABLE + totalColWidth
  return { labelColWidth, totalColWidth, productColWidth, tableWidth, pageWidth }
}

type ChunkDrawContext = {
  columnIndices: number[]
  columns: InstallmentSchedule['columns']
  images: Array<Buffer | null>
  layout: TableLayout
}

function buildChunkContexts(
  doc: PDFKit.PDFDocument,
  schedule: InstallmentSchedule,
  columnChunks: number[][],
  productImages: Array<Buffer | null>,
): ChunkDrawContext[] {
  return columnChunks.map((columnIndices) => {
    const columns = columnIndices.map(i => schedule.columns[i]!)
    return {
      columnIndices,
      columns,
      images: columnIndices.map(i => productImages[i] ?? null),
      layout: computeTableLayout(doc, columns.length),
    }
  })
}

function drawChunkHeaderBlock(
  doc: PDFKit.PDFDocument,
  ctx: ChunkDrawContext,
  y: number,
  options: { cornerLabel: string, isFirst: boolean },
): number {
  const { labelColWidth, totalColWidth, productColWidth, tableWidth } = ctx.layout
  const hasAnyImage = ctx.images.some(Boolean)
  const headerRowHeight = hasAnyImage ? 92 : 56
  const subheadRowHeight = 34
  let x = MARGIN

  doc.rect(x, y, labelColWidth, headerRowHeight).fill(HEADER_BG)
  if (options.isFirst) {
    doc.font('SemiBold').fontSize(8).fillColor('#ffffff')
    doc.text(options.cornerLabel, x + 4, y + headerRowHeight / 2 - 4, { width: labelColWidth - 8 })
  }
  x += labelColWidth

  ctx.columns.forEach((col, i) => {
    drawProductHeaderCell(doc, x, y, productColWidth, headerRowHeight, col, ctx.images[i] ?? null)
    x += productColWidth
  })

  for (let i = ctx.columns.length; i < COLUMNS_PER_TABLE; i++) {
    doc.rect(x, y, productColWidth, headerRowHeight).fill(HEADER_BG)
    x += productColWidth
  }

  const totalX = MARGIN + labelColWidth + productColWidth * COLUMNS_PER_TABLE
  doc.rect(totalX, y, totalColWidth, headerRowHeight).fill(HEADER_BG)
  doc.font('SemiBold').fontSize(8).fillColor('#ffffff')
  doc.text('รวม', totalX + 4, y + headerRowHeight / 2 - 4, { width: totalColWidth - 8, align: 'center' })

  y += headerRowHeight
  x = MARGIN

  doc.rect(x, y, labelColWidth, subheadRowHeight).fill(SUBHEAD_BG)
  if (options.isFirst) {
    doc.font('SemiBold').fontSize(7).fillColor('#ffffff')
    doc.text('เงื่อนไขสัญญา', x + 4, y + 10, { width: labelColWidth - 8 })
  }
  else {
    doc.font('Regular').fontSize(6.5).fillColor('#ffffff')
    doc.text('ต่อ', x + 4, y + 10, { width: labelColWidth - 8, align: 'center' })
  }
  x += labelColWidth

  for (const col of ctx.columns) {
    doc.rect(x, y, productColWidth, subheadRowHeight).fill(SUBHEAD_BG)
    doc.font('Regular').fontSize(6.5).fillColor('#ffffff')
    doc.text(col.contract_condition, x + 3, y + 5, {
      width: productColWidth - 6,
      align: 'center',
    })
    if (col.has_advance && col.advance_amount) {
      doc.font('SemiBold').fontSize(6.5).fillColor('#fde68a')
      doc.text(
        `มัดจำ ${formatPrice(col.advance_amount)} บ.`,
        x + 3,
        y + 18,
        { width: productColWidth - 6, align: 'center' },
      )
    }
    x += productColWidth
  }

  for (let i = ctx.columns.length; i < COLUMNS_PER_TABLE; i++) {
    doc.rect(x, y, productColWidth, subheadRowHeight).fill(SUBHEAD_BG)
    x += productColWidth
  }

  doc.rect(totalX, y, totalColWidth, subheadRowHeight).fill(SUBHEAD_BG)
  return y + subheadRowHeight
}

function measureChunkRowHeight(
  doc: PDFKit.PDFDocument,
  ctx: ChunkDrawContext,
  row: InstallmentSchedule['rows'][number],
  schedule: InstallmentSchedule,
) {
  const cellLinesList = ctx.columnIndices.map((colIndex) => {
    const cell = row.cells[colIndex]!
    const col = schedule.columns[colIndex]!
    return buildScheduleCellHtmlLines(cell, col, schedule.combo_percent, 'cart')
  })
  return Math.max(
    28,
    ...cellLinesList.map(lines => measureCellHeight(doc, ctx.layout.productColWidth, lines)),
    28,
  )
}

function drawChunkDataRow(
  doc: PDFKit.PDFDocument,
  ctx: ChunkDrawContext,
  row: InstallmentSchedule['rows'][number],
  schedule: InstallmentSchedule,
  y: number,
  rowHeight: number,
) {
  const { labelColWidth, totalColWidth, productColWidth } = ctx.layout
  const cellLinesList = ctx.columnIndices.map((colIndex) => {
    const cell = row.cells[colIndex]!
    const col = schedule.columns[colIndex]!
    return buildScheduleCellHtmlLines(cell, col, schedule.combo_percent, 'cart')
  })

  let x = MARGIN + labelColWidth
  ctx.columnIndices.forEach((colIndex, i) => {
    doc.rect(x, y, productColWidth, rowHeight).fill('#ffffff')
    doc.lineWidth(0.5).strokeColor('#e5e7eb').rect(x, y, productColWidth, rowHeight).stroke()
    drawCellText(doc, x, y, productColWidth, cellLinesList[i]!)
    x += productColWidth
  })

  const sectionTotal = ctx.columnIndices.reduce((sum, colIndex) => {
    const cell = row.cells[colIndex]!
    return sum + (cell.in_contract ? cell.charged : 0)
  }, 0)

  const totalX = MARGIN + labelColWidth + productColWidth * COLUMNS_PER_TABLE

  doc.rect(totalX, y, totalColWidth, rowHeight).fill('#f9fafb')
  doc.lineWidth(0.5).strokeColor('#e5e7eb').rect(totalX, y, totalColWidth, rowHeight).stroke()
  doc.font('Bold').fontSize(10).fillColor('#111827')
  doc.text(formatPrice(sectionTotal), totalX + 3, y + 6, {
    width: totalColWidth - 6,
    align: 'center',
  })
  doc.font('Regular').fontSize(7).fillColor('#6b7280')
  doc.text('บาท', totalX + 3, y + 18, { width: totalColWidth - 6, align: 'center' })
  syncDocY(doc, y + rowHeight)
}

function drawMonthLabelCell(
  doc: PDFKit.PDFDocument,
  labelColWidth: number,
  y: number,
  height: number,
  label: string,
) {
  doc.rect(MARGIN, y, labelColWidth, height).fill('#f9fafb')
  doc.lineWidth(0.5).strokeColor('#e5e7eb').rect(MARGIN, y, labelColWidth, height).stroke()
  doc.font('SemiBold').fontSize(8).fillColor('#111827')
  const textHeight = doc.heightOfString(label, { width: labelColWidth - 8 })
  doc.text(label, MARGIN + 4, y + Math.max(8, (height - textHeight) / 2), {
    width: labelColWidth - 8,
  })
  syncDocY(doc, y + height)
}

function estimateHeaderBlockHeight(hasAnyImage: boolean) {
  return (hasAnyImage ? 92 : 56) + 34
}

function drawTableDataRow(
  doc: PDFKit.PDFDocument,
  ctx: ChunkDrawContext,
  row: InstallmentSchedule['rows'][number],
  schedule: InstallmentSchedule,
  y: number,
  rowHeight: number,
) {
  const { labelColWidth, productColWidth } = ctx.layout
  drawMonthLabelCell(doc, labelColWidth, y, rowHeight, row.label)
  drawChunkDataRow(doc, ctx, row, schedule, y, rowHeight)

  // ช่องว่างสินค้าที่เหลือ (ชุดสุดท้ายมีน้อยกว่า COLUMNS_PER_TABLE)
  const emptySlots = COLUMNS_PER_TABLE - ctx.columns.length
  if (emptySlots > 0) {
    let x = MARGIN + labelColWidth + productColWidth * ctx.columns.length
    for (let i = 0; i < emptySlots; i++) {
      doc.rect(x, y, productColWidth, rowHeight).fill('#fafafa')
      doc.lineWidth(0.5).strokeColor('#e5e7eb').rect(x, y, productColWidth, rowHeight).stroke()
      x += productColWidth
    }
  }
}

function drawInstallmentTableSection(
  doc: PDFKit.PDFDocument,
  schedule: InstallmentSchedule,
  columnIndices: number[],
  productImages: Array<Buffer | null>,
  startY: number,
  options: {
    tableIndex: number
    tableCount: number
    showPromo: boolean
  },
): number {
  const ctx = buildChunkContexts(doc, schedule, [columnIndices], productImages)[0]!
  const { tableWidth } = ctx.layout
  const hasAnyImage = ctx.images.some(Boolean)
  const headerBlockHeight = estimateHeaderBlockHeight(hasAnyImage)
  const isLastTable = options.tableIndex === options.tableCount - 1
  const firstRowHeight = schedule.rows.length
    ? measureChunkRowHeight(doc, ctx, schedule.rows[0]!, schedule)
    : 28

  let y = startY

  if (options.tableIndex > 0) {
    y = ensureSpace(doc, y, headerBlockHeight + firstRowHeight + 20)
    y += 6
    if (y + 14 <= pageContentBottom(doc)) {
      doc.moveTo(MARGIN, y).lineTo(MARGIN + tableWidth, y)
        .lineWidth(0.75).strokeColor('#d1d5db').stroke()
      y += 14
    }
  }

  if (options.showPromo && schedule.promo_headline) {
    y = ensureSpace(doc, y, 28)
    doc.roundedRect(MARGIN, y, tableWidth, 22, 4).fill(ACCENT)
    doc.font('SemiBold').fontSize(8.5).fillColor('#ffffff')
    doc.text(schedule.promo_headline, MARGIN + 8, y + 6, {
      width: tableWidth - 16,
      align: 'center',
    })
    y += 28
  }

  const drawHeaders = (headerY: number) => {
    return drawChunkHeaderBlock(doc, ctx, headerY, {
      cornerLabel: 'เดือนที่',
      isFirst: true,
    })
  }

  y = ensureSpace(doc, y, headerBlockHeight)
  y = drawHeaders(y)

  for (const row of schedule.rows) {
    const rowHeight = measureChunkRowHeight(doc, ctx, row, schedule)
    if (y + rowHeight > pageContentBottom(doc)) {
      doc.addPage({ size: 'A4', layout: PAGE_LAYOUT, margin: MARGIN })
      y = MARGIN
      y = ensureSpace(doc, y, headerBlockHeight)
      y = drawHeaders(y)
    }
    drawTableDataRow(doc, ctx, row, schedule, y, rowHeight)
    y += rowHeight
    syncDocY(doc, y)
  }

  if (isLastTable) {
    syncDocY(doc, y + 6)
    return y + 6
  }

  syncDocY(doc, y + 6)
  return y + 6
}

function drawInstallmentScheduleTables(
  doc: PDFKit.PDFDocument,
  schedule: InstallmentSchedule,
  columnChunks: number[][],
  productImages: Array<Buffer | null>,
  startY: number,
): number {
  let y = startY
  const tableCount = columnChunks.length

  columnChunks.forEach((columnIndices, tableIndex) => {
    y = drawInstallmentTableSection(doc, schedule, columnIndices, productImages, y, {
      tableIndex,
      tableCount,
      showPromo: tableIndex === 0,
    })
  })

  return y
}

const PAGE_BOTTOM_RESERVE = 24

function pageContentBottom(doc: PDFKit.PDFDocument) {
  return doc.page.height - PAGE_BOTTOM_RESERVE
}

/** ซิงก์ cursor ของ PDFKit หลังวาดด้วยพิกัดแบบ manual */
function syncDocY(doc: PDFKit.PDFDocument, y: number) {
  doc.x = MARGIN
  doc.y = y
}

function ensureSpace(doc: PDFKit.PDFDocument, y: number, needed: number) {
  if (y + needed <= pageContentBottom(doc)) return y
  doc.addPage({ size: 'A4', layout: PAGE_LAYOUT, margin: MARGIN })
  return MARGIN
}

function measureSummaryRowHeight(
  doc: PDFKit.PDFDocument,
  width: number,
  row: CartPdfSummary['due_today_rows'][number],
) {
  doc.font(row.accent ? 'SemiBold' : 'Regular').fontSize(8.5)
  const labelHeight = doc.heightOfString(row.label, { width: width * 0.62 })
  doc.font(row.accent ? 'Bold' : 'Regular')
  const valueHeight = doc.heightOfString(row.value, { width: width * 0.38 })
  return Math.max(labelHeight, valueHeight, 12)
}

function measureSummaryRowsHeight(
  doc: PDFKit.PDFDocument,
  width: number,
  rows: CartPdfSummary['due_today_rows'],
) {
  if (!rows.length) return 0
  const rowGap = 4
  return rows.reduce(
    (height, row) => height + measureSummaryRowHeight(doc, width, row) + rowGap,
    0,
  ) - rowGap
}

function drawSummaryRows(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  rows: CartPdfSummary['due_today_rows'],
  options?: { rowGap?: number, valueWidthRatio?: number },
) {
  const rowGap = options?.rowGap ?? 4
  const valueRatio = options?.valueWidthRatio ?? 0.38
  const labelRatio = 1 - valueRatio
  let cursorY = y
  for (const row of rows) {
    const rowHeight = measureSummaryRowHeight(doc, width, row)
    const isGrandTotal = row.label === 'รวมชำระวันนี้' || row.label === 'ยอดสุทธิโดยประมาณตลอดสัญญา'
    doc.font(row.accent || isGrandTotal ? 'SemiBold' : 'Regular')
      .fontSize(isGrandTotal ? 10 : 8.5)
      .fillColor(row.accent || isGrandTotal ? ACCENT : '#374151')
    doc.text(row.label, x, cursorY, { width: width * labelRatio, align: 'left' })
    doc.font(row.accent || isGrandTotal ? 'Bold' : 'Regular')
      .fontSize(isGrandTotal ? 11 : 8.5)
      .fillColor(row.accent || isGrandTotal ? ACCENT : '#111827')
    doc.text(row.value, x + width * labelRatio, cursorY, {
      width: width * valueRatio,
      align: 'right',
    })
    cursorY += rowHeight + rowGap
  }
  syncDocY(doc, cursorY)
  return cursorY
}

const QUOTE_PANEL_WIDTH_RATIO = 0.56
const SUBSCRIBE_ROW_GAP = 5

function measureSubscribeBenefitRowHeight(
  doc: PDFKit.PDFDocument,
  width: number,
  text: string,
  value: string,
) {
  doc.font('Regular').fontSize(8)
  const textH = doc.heightOfString(text, { width: width * 0.58 })
  const valueH = doc.heightOfString(value, { width: width * 0.38 })
  return Math.max(textH, valueH, 10) + 10
}

function drawSubscribeBenefitRow(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  text: string,
  value: string,
) {
  const rowHeight = measureSubscribeBenefitRowHeight(doc, width, text, value) - SUBSCRIBE_ROW_GAP
  doc.roundedRect(x, y, width, rowHeight, 4).fill('#f9fafb')
  doc.roundedRect(x, y, width, rowHeight, 4).lineWidth(0.5).strokeColor('#e5e7eb').stroke()
  doc.font('Regular').fontSize(8).fillColor('#374151')
  doc.text(text, x + 10, y + 5, { width: width * 0.58 - 10 })
  doc.font('Regular').fontSize(8).fillColor('#111827')
  doc.text(value, x + 10, y + 5, { width: width - 20, align: 'right' })
  syncDocY(doc, y + rowHeight + SUBSCRIBE_ROW_GAP)
  return y + rowHeight + SUBSCRIBE_ROW_GAP
}

function measureSubscribeProductHeight(
  doc: PDFKit.PDFDocument,
  contentWidth: number,
  product: CartPdfSummary['subscribe_products'][number],
) {
  doc.font('SemiBold').fontSize(8.5)
  let height = doc.heightOfString(
    product.quantity > 1 ? `${product.name} (×${product.quantity})` : product.name,
    { width: contentWidth - 16 },
  ) + 6

  for (const row of product.rows) {
    height += measureSubscribeBenefitRowHeight(
      doc,
      contentWidth - 16,
      row.text || '—',
      formatSubscribeValueForPdf(row.price),
    )
  }

  if (product.quantity > 1 && product.total_value > 0) {
    height += 18
  }
  return height + 8
}

function drawSectionDivider(doc: PDFKit.PDFDocument, y: number, contentWidth: number) {
  y += 10
  doc.moveTo(MARGIN, y).lineTo(MARGIN + contentWidth, y)
    .lineWidth(0.75).dash(4, { space: 4 }).strokeColor('#d1d5db').stroke()
  doc.undash()
  syncDocY(doc, y + 14)
  return y + 14
}

function measureQuotePanelInnerHeight(
  doc: PDFKit.PDFDocument,
  innerWidth: number,
  summary: CartPdfSummary,
) {
  let height = 12

  if (summary.due_today_rows.length) {
    height += measureSummaryRowsHeight(doc, innerWidth, summary.due_today_rows) + 10
    height += measureSummaryRowHeight(doc, innerWidth, {
      label: 'รวมชำระวันนี้',
      value: summary.due_today_total,
      accent: true,
    }) + 10
  }

  if (summary.has_discount_section) {
    height += 22
    height += measureSummaryRowsHeight(doc, innerWidth, summary.discount_rows) + 4
  }

  return height + 10
}

function measureQuotePriceBlockHeight(
  doc: PDFKit.PDFDocument,
  contentWidth: number,
  summary: CartPdfSummary,
) {
  const panelWidth = contentWidth * QUOTE_PANEL_WIDTH_RATIO
  const innerWidth = panelWidth - 24
  const panelHeight = measureQuotePanelInnerHeight(doc, innerWidth, summary)
  return Math.max(36, panelHeight) + 10
}

function drawQuotePriceBlock(
  doc: PDFKit.PDFDocument,
  summary: CartPdfSummary,
  contentWidth: number,
  startY: number,
): number {
  const panelWidth = contentWidth * QUOTE_PANEL_WIDTH_RATIO
  const panelX = MARGIN + contentWidth - panelWidth
  const innerX = panelX + 12
  const innerWidth = panelWidth - 24
  const panelHeight = measureQuotePanelInnerHeight(doc, innerWidth, summary)
  const blockHeight = Math.max(36, panelHeight) + 10

  let y = ensureSpace(doc, startY, blockHeight)

  doc.font('Bold').fontSize(13).fillColor('#111827')
  doc.text('สรุปราคา (โดยประมาณ)', MARGIN, y, { width: contentWidth * 0.42 })
  doc.font('Regular').fontSize(8.5).fillColor('#6b7280')
  doc.text('ถ้าเริ่มสัญญาวันนี้', MARGIN, doc.y + 2, { width: contentWidth * 0.42 })

  const panelY = y
  doc.roundedRect(panelX, panelY, panelWidth, panelHeight, 6).fill('#ffffff')
  doc.roundedRect(panelX, panelY, panelWidth, panelHeight, 6).lineWidth(0.75).strokeColor('#e5e7eb').stroke()

  let innerY = panelY + 12

  if (summary.due_today_rows.length) {
    innerY = drawSummaryRows(doc, innerX, innerY, innerWidth, summary.due_today_rows)
    innerY += 2
    doc.moveTo(innerX, innerY).lineTo(innerX + innerWidth, innerY)
      .lineWidth(0.5).strokeColor('#e5e7eb').stroke()
    innerY += 6
    innerY = drawSummaryRows(doc, innerX, innerY, innerWidth, [{
      label: 'รวมชำระวันนี้',
      value: summary.due_today_total,
      accent: true,
    }])
    innerY += 4
  }

  if (summary.has_discount_section) {
    doc.font('SemiBold').fontSize(8).fillColor('#6b7280')
    doc.text('ภาพรวมตลอดสัญญา', innerX, innerY, { width: innerWidth })
    innerY = doc.y + 6
    innerY = drawSummaryRows(doc, innerX, innerY, innerWidth, summary.discount_rows)
  }

  y = Math.max(panelY + panelHeight, doc.y) + 6
  syncDocY(doc, y)
  return y
}

function drawSubscribeBenefitsBlock(
  doc: PDFKit.PDFDocument,
  summary: CartPdfSummary,
  contentWidth: number,
  startY: number,
): number {
  let y = startY

  doc.font('SemiBold').fontSize(13).fillColor(ACCENT)
  doc.text('สิทธิประโยชน์ Subscribe', MARGIN, y, { width: contentWidth })
  doc.font('Regular').fontSize(8.5).fillColor('#6b7280')
  doc.text('บริการและสิทธิ์ที่ได้รับตลอดสัญญา (ไม่มีค่าใช้จ่ายเพิ่มเติม)', MARGIN, doc.y + 2, {
    width: contentWidth,
  })
  y = doc.y + 12
  syncDocY(doc, y)

  for (const product of summary.subscribe_products) {
    const blockHeight = measureSubscribeProductHeight(doc, contentWidth, product)
    y = ensureSpace(doc, y, blockHeight)

    const productTitle = product.quantity > 1
      ? `${product.name} (×${product.quantity})`
      : product.name
    doc.font('SemiBold').fontSize(8.5).fillColor('#111827')
    doc.text(productTitle, MARGIN + 4, y, { width: contentWidth - 8 })
    y = doc.y + 6

    const rowX = MARGIN + 4
    const rowWidth = contentWidth - 8
    for (const row of product.rows) {
      y = drawSubscribeBenefitRow(
        doc,
        rowX,
        y,
        rowWidth,
        row.text || '—',
        formatSubscribeValueForPdf(row.price),
      )
    }

    if (product.quantity > 1 && product.total_value > 0) {
      doc.font('SemiBold').fontSize(7.5).fillColor('#6b7280')
      doc.text(
        `รวมมูลค่า Subscribe (${product.quantity} ชิ้น)`,
        MARGIN + 12,
        y,
        { width: contentWidth * 0.58 },
      )
      doc.text(formatSubscribeTotalForPdf(product.total_value), MARGIN + 12, y, {
        width: contentWidth - 24,
        align: 'right',
      })
      y = doc.y + 6
      syncDocY(doc, y)
    }

    y += 4
    syncDocY(doc, y)
  }

  y = ensureSpace(doc, y, 44)
  doc.roundedRect(MARGIN, y, contentWidth, 34, 6).fill(ACCENT)
  doc.font('SemiBold').fontSize(9).fillColor('#ffffff')
  doc.text('รวมมูลค่า Subscribe ที่ได้รับโดยประมาณ', MARGIN + 12, y + 10, {
    width: contentWidth * 0.58,
  })
  doc.font('Bold').fontSize(12).fillColor('#ffffff')
  doc.text(formatSubscribeTotalForPdf(summary.subscribe_total), MARGIN + 12, y + 8, {
    width: contentWidth - 24,
    align: 'right',
  })
  y += 44
  syncDocY(doc, y)

  doc.font('Regular').fontSize(6.5).fillColor('#9ca3af')
  doc.text(
    '* บริการนี้ไม่มีค่าใช้จ่ายเพิ่มเติม · ราคาประเมินอ้างอิงข้อมูลจาก LG.com อาจเปลี่ยนแปลงตามโปรโมชั่น',
    MARGIN,
    y + 4,
    { width: contentWidth },
  )
  y = doc.y + 8
  syncDocY(doc, y)
  return y
}

function measureCartSummaryIntroHeight(
  doc: PDFKit.PDFDocument,
  contentWidth: number,
  summary: CartPdfSummary,
) {
  if (summary.has_subscribe_section && summary.subscribe_products[0]) {
    return 36 + measureSubscribeProductHeight(doc, contentWidth, summary.subscribe_products[0])
  }
  if (summary.due_today_rows.length || summary.has_discount_section) {
    return measureQuotePriceBlockHeight(doc, contentWidth, summary)
  }
  return 48
}

function drawCartSummarySection(
  doc: PDFKit.PDFDocument,
  summary: CartPdfSummary,
  contentWidth: number,
): number {
  const hasPrice = summary.due_today_rows.length > 0 || summary.has_discount_section
  if (!summary.has_subscribe_section && !hasPrice) {
    return MARGIN
  }

  const introHeight = measureCartSummaryIntroHeight(doc, contentWidth, summary)
  let y = ensureSpace(doc, MARGIN, introHeight)

  if (summary.has_subscribe_section) {
    y = drawSubscribeBenefitsBlock(doc, summary, contentWidth, y)
  }

  if (hasPrice) {
    if (summary.has_subscribe_section) {
      y = drawSectionDivider(doc, y, contentWidth)
    }
    y = drawQuotePriceBlock(doc, summary, contentWidth, y)
  }

  return y
}

export async function renderInstallmentScheduleToPdfBuffer(
  schedule: InstallmentSchedule,
  summary?: CartPdfSummary | null,
): Promise<Buffer> {
  const productImages = await fetchProductImagesForPdf(
    schedule.columns.map(col => col.image_url),
  )

  const fontRegular = resolveFontFile('Prompt-Regular.ttf')
  const fontSemiBold = resolveFontFile('Prompt-SemiBold.ttf')
  const fontBold = resolveFontFile('Prompt-Bold.ttf')

  const columnChunks = chunkColumnIndices(schedule.columns.length, COLUMNS_PER_TABLE)
  const tableCount = columnChunks.length

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: PAGE_LAYOUT,
      margin: MARGIN,
      autoFirstPage: true,
    })

    const chunks: Buffer[] = []
    doc.on('data', chunk => chunks.push(chunk as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.registerFont('Regular', fontRegular)
    doc.registerFont('SemiBold', fontSemiBold)
    doc.registerFont('Bold', fontBold)

    const generatedAt = new Date().toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    doc.font('Bold').fontSize(16).fillColor('#111827')
      .text('ตารางชำระรายเดือน', MARGIN, MARGIN)
    doc.font('Regular').fontSize(8).fillColor('#6b7280')
      .text(
        `สร้างเมื่อ ${generatedAt} · ${schedule.columns.length} รายการ · รวมส่วนลด Combo`
        + (tableCount > 1 ? ` · ${schedule.columns.length} รายการ (${tableCount} ชุด × ${COLUMNS_PER_TABLE})` : ''),
        MARGIN,
        doc.y + 2,
      )

    let y = doc.y + 12

    y = drawInstallmentScheduleTables(doc, schedule, columnChunks, productImages, y)

    if (summary) {
      doc.addPage({ size: 'A4', layout: PAGE_LAYOUT, margin: MARGIN })
      const pageWidth = doc.page.width - MARGIN * 2
      syncDocY(doc, MARGIN)
      drawCartSummarySection(doc, summary, pageWidth)
    }

    doc.end()
  })
}
