import sharp from 'sharp'

const MAX_SIDE_PX = 1920
const PRIMARY_WEBP_QUALITY = 80
const FALLBACK_WEBP_QUALITY = 65
const MAX_OUTPUT_BYTES = 600 * 1024

/** แปลงรูปอัปโหลดเป็น WebP — หมุนตาม EXIF, ย่อด้านยาวสุดไม่เกิน 1920px */
export async function optimizeUploadImageToWebp(input: Buffer): Promise<Buffer> {
  const base = sharp(input, { failOn: 'none' }).rotate()
  const metadata = await base.metadata()
  const shouldResize = (metadata.width ?? 0) > MAX_SIDE_PX || (metadata.height ?? 0) > MAX_SIDE_PX
  const resized = shouldResize
    ? base.resize({ width: MAX_SIDE_PX, height: MAX_SIDE_PX, fit: 'inside', withoutEnlargement: true })
    : base

  let output = await resized.webp({ quality: PRIMARY_WEBP_QUALITY, effort: 4 }).toBuffer()
  if (output.length > MAX_OUTPUT_BYTES) {
    output = await resized.webp({ quality: FALLBACK_WEBP_QUALITY, effort: 4 }).toBuffer()
  }
  return output
}
