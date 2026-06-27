import type { Product } from '../types/product'

/** ชื่อการ์ดกลาง (ไม่ใส่นิ้ว/SKU) สำหรับ product_groups.display_name */
export function deriveGroupDisplayName(name: string | null | undefined) {
  if (!name?.trim()) return 'สินค้า'
  let s = name.trim()
  s = s.replace(/\s*รุ่น\s+[A-Z0-9-]+/gi, '')
  s = s.replace(/ทีวี\s*\d+\s*"/gi, 'ทีวี')
  s = s.replace(/\s*\(\d+\s*(?:inch|นิ้ว|")\)/gi, '')
  s = s.replace(/\s+/g, ' ').trim()
  return s || name.trim()
}

/** เรียง variant บนการ์ด — ดึงตัวเลขจาก "65 inch" / "12000 BTU" */
export function parseVariantSort(label: string | null | undefined) {
  const m = String(label ?? '').match(/(\d+)/)
  return m ? Number(m[1]) : null
}

export type ProductDisplayGroup = {
  groupId: string | null
  groupKey: string | null
  displayName: string
  variants: Product[]
}

/** ชื่อบนการ์ด storefront ตาม variant ที่เลือก — อัปเดต BTU / นิ้ว / รุ่น (SKU) */
export function variantStorefrontTitle(variant: Product): string {
  const name = variant.name?.trim()
  if (!name) return 'สินค้า'

  const label = variant.variant_label?.trim()
  const sku = variant.sku?.trim().toUpperCase()
  if (!label && !sku) return name

  let title = name
  if (sku) {
    title = title.replace(/รุ่น\s+[A-Z0-9-]+/gi, `รุ่น ${sku}`)
  }

  const btuLabel = label?.match(/(\d[\d,]*)\s*BTU/i)
  if (btuLabel && /\d[\d,]*\s*BTU/i.test(title)) {
    title = title.replace(/\d[\d,]*\s*BTU/i, `${btuLabel[1]} BTU`)
  }

  const inch = label?.match(/(\d+)\s*(?:inch|นิ้ว|")/i)?.[1]
    ?? (label && !/BTU/i.test(label) ? label.match(/(\d+)/)?.[1] : null)
  if (inch && /ทีวี/i.test(title)) {
    if (/ทีวี\s*\d+/i.test(title)) {
      title = title.replace(/ทีวี\s*\d+\s*"/i, `ทีวี ${inch}"`)
    }
    else {
      title = title.replace(/^ทีวี/i, `ทีวี ${inch}"`)
    }
  }

  return title
}

function variantSortValue(p: Product) {
  return p.variant_sort ?? parseVariantSort(p.variant_label) ?? 9999
}

/** จัดกลุ่ม products ตาม group_id (SKU เดี่ยว = กลุ่มของตัวเอง) */
export function groupProducts(products: Product[]): ProductDisplayGroup[] {
  const map = new Map<string, Product[]>()
  const meta = new Map<string, {
    groupId: string | null
    groupKey: string | null
    displayName: string | null
  }>()

  for (const p of products) {
    const key = p.group_id ? `group:${p.group_id}` : `sku:${p.id}`
    if (!meta.has(key)) {
      meta.set(key, {
        groupId: p.group_id ?? null,
        groupKey: p.product_group?.group_key ?? null,
        displayName: p.product_group?.display_name ?? null,
      })
    }
    const list = map.get(key) ?? []
    list.push(p)
    map.set(key, list)
  }

  const groups: ProductDisplayGroup[] = []
  for (const [key, variants] of map) {
    const sorted = [...variants].sort((a, b) => variantSortValue(a) - variantSortValue(b))
    const m = meta.get(key)!
    groups.push({
      groupId: m.groupId,
      groupKey: m.groupKey,
      displayName: m.displayName ?? deriveGroupDisplayName(sorted[0]?.name),
      variants: sorted,
    })
  }

  return groups.sort((a, b) => {
    const sa = a.variants[0]?.product_group?.sort_order ?? 9999
    const sb = b.variants[0]?.product_group?.sort_order ?? 9999
    if (sa !== sb) return sa - sb
    return a.displayName.localeCompare(b.displayName, 'th')
  })
}
