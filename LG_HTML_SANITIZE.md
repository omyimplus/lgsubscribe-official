# LG HTML Sanitize (Import Pipeline)

เอกสารอธิบายการทำความสร้าง HTML จาก LG ก่อนบันทึก `import_products` / `products`

## ทำไมต้อง sanitize

- หน้าเว็บเราแสดงด้วย `v-html` + Tailwind `prose` — **ไม่ได้โหลด CSS ของ LG**
- class/id/data-* จาก LG (`c-list`, `cmp-*`, `data-cq-*`) ไม่มีผลแต่ทำให้ HTML ยาวและแก้ยาก
- ลดความเสี่ยง attribute แปลกๆ (`onclick`, inline `style`)

## จุดที่รัน

- `server/utils/sanitizeLgHtml.ts`
- เรียกจาก `parseTvDetail()` ใน `server/utils/lgTvImport.ts` หลังดึง section แล้ว ก่อน return / insert DB
- ก่อน upsert draft จะรัน `server/utils/lgImageMirror.ts` เพื่อ mirror รูปไป Supabase และ rewrite `<img src>`
- วิดีโอใน `<video>` / `<source>` จะ mirror ไป `lg-import/{batchId}/{sku}/videos/…` และ rewrite `src` (สูงสุด 8 ไฟล์/สินค้า, ≤25MB/ไฟล์)

## โหมดต่อ field

| Field | Mode | พฤติกรรม |
|-------|------|----------|
| `key_features` | `minimal` | ดึงข้อความจาก `<li>` → สร้าง `<ul class="product-key-features">` ใหม่ |
| `description`, `faq_html` | `standard` | allowlist tag พื้นฐาน, ตัด class/id/data-*/style |
| `features`, `specifications` | `light` | เหมือน standard แต่เก็บ tag โครงสร้างมากขึ้น (`section`, `iframe`, …) |

## สิ่งที่ลบ / เก็บ

**ลบ:** `script`, `style`, `class` (ยกเว้น whitelist), `id`, `style`, `data-*`, `aria-*`, `role`, event handlers

**เก็บ attribute:** `href`, `src` (rewrite `/content/...` → `https://www.lg.com/content/...`), `alt`, `title`, `controls`, ฯลฯ

**class whitelist:** `product-key-features`, `faq-list`, `faq-item`

## หมายเหตุ

- Draft ที่ import ก่อนหน้านี้ยังเป็น HTML เก่า — ต้อง **import ใหม่** ถึงจะได้ HTML สะอาด
- `features` / `specifications` อาจยังใหญ่และ layout ไม่เหมือน LG หลังตัด class — ปรับทีหลังถ้าต้องการ
- image mirror จำกัดสูงสุด 14 รูปต่อสินค้า (คุมค่าใช้จ่าย), แปลงเป็น WebP + ย่อด้านยาวไม่เกิน 1920px
- video mirror จำกัดสูงสุด 8 ไฟล์ต่อสินค้า, เก็บต้นฉบับ (mp4/webm/mov) ไม่แปลงรูปแบบ
- หลัง sanitize: รวมบล็อก media ของ LG (`collapseLgMediaBlocks`) — เลือก mp4 หลัก 1 ไฟล์จากหลาย `<source>` (มักมี mobile/desktop), ใช้รูปเป็น `poster` แล้วลบ `<img>` preview ที่ซ้ำ / วิดีโอซ้ำ
- `pruneEmptyElements` ต้องไม่ลบ `<video src="…">` ที่ไม่มีลูก (หลัง collapse วิดีโอไม่มี `<source>` ข้างในแล้ว)
