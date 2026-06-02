import type { SupabaseClient } from '@supabase/supabase-js'

export const IMPORT_ASSETS_BUCKET = 'product-images'
export const IMPORT_ASSETS_PREFIX = 'lg-import/'

type SupabaseAdmin = SupabaseClient

export type ProductMediaRow = {
  image_url: string | null
  image_urls: unknown
  description: string | null
  key_features: string | null
  features: string | null
  specifications: string | null
  faq_html: string | null
}

/** แปลง public URL ของ Supabase Storage กลับเป็น object path */
export function storagePathFromPublicUrl(url: string | null | undefined) {
  const raw = String(url ?? '').trim()
  if (!raw) return null

  try {
    const parsed = new URL(raw)
    const marker = `/storage/v1/object/public/${IMPORT_ASSETS_BUCKET}/`
    const idx = parsed.pathname.indexOf(marker)
    if (idx < 0) return null
    return decodeURIComponent(parsed.pathname.slice(idx + marker.length))
  }
  catch {
    return null
  }
}

function extractImageUrlsFromHtml(html: string | null | undefined) {
  if (!html) return []
  return [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
    .map(m => m[1].trim())
    .filter(Boolean)
}

function extractVideoUrlsFromHtml(html: string | null | undefined) {
  if (!html) return []
  const urls: string[] = []
  if (!html) return urls

  for (const m of html.matchAll(/<video[^>]+src=["']([^"']+)["']/gi)) {
    urls.push(m[1].trim())
  }
  for (const m of html.matchAll(/<source[^>]+src=["']([^"']+)["']/gi)) {
    urls.push(m[1].trim())
  }
  return urls
}

/** รวบรวม storage path จาก URL รูป/วิดีโอในแถวสินค้า (products หรือ import_products) */
export function collectStoragePathsFromMediaRow(row: ProductMediaRow) {
  const paths = new Set<string>()

  const imageUrls = Array.isArray(row.image_urls)
    ? row.image_urls.filter((u): u is string => typeof u === 'string')
    : []

  for (const url of [row.image_url, ...imageUrls]) {
    const path = storagePathFromPublicUrl(url)
    if (path) paths.add(path)
  }

  for (const field of [
    row.description,
    row.key_features,
    row.features,
    row.specifications,
    row.faq_html,
  ]) {
    for (const url of [
      ...extractImageUrlsFromHtml(field),
      ...extractVideoUrlsFromHtml(field),
    ]) {
      const path = storagePathFromPublicUrl(url)
      if (path) paths.add(path)
    }
  }

  return [...paths]
}

/** @deprecated ใช้ collectStoragePathsFromMediaRow */
export const collectStoragePathsFromImportRow = collectStoragePathsFromMediaRow

export type RemoveStoragePathsResult = {
  removedFiles: number
  errors: string[]
}

/** ลบ object ใน bucket product-images ตาม path ที่ระบุ */
export async function removeStoragePaths(
  supabase: SupabaseAdmin,
  paths: string[],
): Promise<RemoveStoragePathsResult> {
  const unique = [...new Set(paths.filter(Boolean))]
  if (!unique.length) return { removedFiles: 0, errors: [] }

  const errors: string[] = []
  let removedFiles = 0

  for (const group of chunk(unique, 100)) {
    const { error } = await supabase.storage.from(IMPORT_ASSETS_BUCKET).remove(group)
    if (error) {
      errors.push(error.message)
      continue
    }
    removedFiles += group.length
  }

  return { removedFiles, errors }
}

/** path ที่ products ปัจจุบันยังอ้างอิง — ห้ามลบตอนเคลียร์ draft */
export async function collectProtectedImportAssetPaths(supabase: SupabaseAdmin) {
  const { data, error } = await supabase
    .from('products')
    .select('image_url, image_urls, description, key_features, features, specifications, faq_html')

  if (error) throw new Error(error.message)

  const protectedPaths = new Set<string>()
  for (const row of data ?? []) {
    for (const path of collectStoragePathsFromMediaRow(row)) {
      if (path.startsWith(IMPORT_ASSETS_PREFIX)) {
        protectedPaths.add(path)
      }
    }
  }
  return protectedPaths
}

const PRODUCT_MEDIA_SELECT = 'image_url, image_urls, description, key_features, features, specifications, faq_html'

export async function collectProductStoragePaths(
  supabase: SupabaseAdmin,
  productIds?: string[],
) {
  let query = supabase.from('products').select(PRODUCT_MEDIA_SELECT)
  if (productIds?.length) {
    query = query.in('id', productIds)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const paths = new Set<string>()
  for (const row of data ?? []) {
    for (const path of collectStoragePathsFromMediaRow(row)) {
      paths.add(path)
    }
  }
  return [...paths]
}

async function listStoragePathsUnderPrefix(
  supabase: SupabaseAdmin,
  prefix: string,
) {
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '')
  const paths: string[] = []

  async function walk(folder: string) {
    const { data, error } = await supabase.storage
      .from(IMPORT_ASSETS_BUCKET)
      .list(folder, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

    if (error || !data?.length) return

    for (const entry of data) {
      const fullPath = folder ? `${folder}/${entry.name}` : entry.name
      if (entry.id === null) {
        await walk(fullPath)
      }
      else {
        paths.push(fullPath)
      }
    }
  }

  await walk(normalizedPrefix)
  return paths
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export type PurgeImportDraftStorageResult = {
  batchIds: string[]
  removedFiles: number
  skippedProtected: number
  errors: string[]
}

/**
 * ลบไฟล์ mirror ของ draft batch ใน Storage
 * - ลบเฉพาะ path ใต้ lg-import/{batchId}/
 * - ไม่ลบ path ที่ products ยังอ้างอิงอยู่ (เช่น batch ที่ promote ไปแล้ว)
 */
export async function purgeImportDraftStorage(
  supabase: SupabaseAdmin,
  batchIds: string[],
  extraPaths: string[] = [],
): Promise<PurgeImportDraftStorageResult> {
  const uniqueBatchIds = [...new Set(batchIds.filter(Boolean))]
  if (!uniqueBatchIds.length) {
    return { batchIds: [], removedFiles: 0, skippedProtected: 0, errors: [] }
  }

  const protectedPaths = await collectProtectedImportAssetPaths(supabase)
  const toRemove = new Set<string>()
  let skippedProtected = 0

  const allowedPrefixes = uniqueBatchIds.map(id => `${IMPORT_ASSETS_PREFIX}${id}/`)

  for (const batchId of uniqueBatchIds) {
    const prefix = `${IMPORT_ASSETS_PREFIX}${batchId}`
    const listed = await listStoragePathsUnderPrefix(supabase, prefix)
    for (const path of listed) {
      if (protectedPaths.has(path)) {
        skippedProtected += 1
        continue
      }
      toRemove.add(path)
    }
  }

  for (const path of extraPaths) {
    if (!allowedPrefixes.some(prefix => path.startsWith(prefix))) continue
    if (protectedPaths.has(path)) {
      skippedProtected += 1
      continue
    }
    toRemove.add(path)
  }

  const { removedFiles, errors } = await removeStoragePaths(supabase, [...toRemove])

  return {
    batchIds: uniqueBatchIds,
    removedFiles,
    skippedProtected,
    errors,
  }
}
