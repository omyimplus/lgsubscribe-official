import type { Product } from '~~/shared/types/product'

/** บรรทัด "ต่อเดือน รับประกันนาน X ปี" จาก warranty_years */
export function productWarrantyLine(product: Pick<Product, 'warranty_years'>) {
  const y = product.warranty_years
  if (!y) return 'ต่อเดือน'
  return `ต่อเดือน รับประกันนาน ${y} ปี`
}
