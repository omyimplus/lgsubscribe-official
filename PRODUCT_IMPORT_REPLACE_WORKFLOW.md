# Product Import Workflow (Draft-First, Merge by SKU)

เอกสารนี้ใช้ล็อก flow import แบบแยกตารางก่อน promote เข้าสู่ `products`

## เป้าหมาย

1. ดึง **รายการ SKU/ชื่อ** จาก LG (ไม่ scrape detail) เพื่อเลือกว่าจะ import ชิ้นไหน
2. Import เฉพาะที่เลือก หรือทั้งหมด (ครั้งแรก) → `import_products` draft
3. Human ตรวจ/แก้ draft (editor)
4. **นำขึ้น Products แบบผสาน (merge)** — ไม่ลบสินค้าเดิมทั้งหมด

## โครงสร้างตาราง

- `import_batches` — รอบการนำเข้า
- `import_products` — ข้อมูลรอ promote
- `products` — ใช้งานจริง (`sku` unique)

## Flow หลัก

### ① ดึงรายการจาก LG

- `GET /api/admin/import/catalog?source=tvs` (หรือ `air-conditioners`, `television`, …)
- URL หมวดดู `LG_SUBSCRIPTION_SOURCE_URLS.md` / `server/utils/lgSubscriptionSources.ts`
- Playwright (headless + stealth) เปิด PLP ทีวี แล้วอ่าน **เฉพาะ DOM** — การ์ด + คลิก swatch (นิ้ว) → SKU, ขนาด, ราคา/เดือน
- **ไม่** รวม Coveo / `retrieveProductList` (hardcode) — จำนวนรายการต้องตรงหน้า LG
- Pagination LG: `firstResult=9,18,27,...` (ยังไม่วนอัตโนมัติ — ทำต่อ)
- เทียบกับ `products` แล้วแสดงสถานะ: **ใหม่** / **มีในระบบ** / **ไม่พบใน LG** (มีใน products แต่ไม่อยู่ใน list)

### ② Import → Draft

- `POST /api/admin/import/tvs-draft`
  - `{ skus: string[] }` — import เฉพาะที่เลือก (รายเดือน)
  - `{ importAll: true }` — import ทั้งหมดจาก list (ครั้งแรก)
  - `{ testLimit: 3 }` — ทดสอบ 3 รายการ
- Scrape detail + mirror รูป/วิดีโอ → `import_products`

### ③ ตรวจ Draft + Human

- `/admin/import-items/:itemId` และ detail editor ต่อ field

### ④ นำขึ้น Products (Merge)

- `POST /api/admin/import/confirm` → RPC `promote_import_batch`
- **สินค้าใหม่ (SKU ยังไม่มี):** INSERT ครบทุก field รวม HTML
- **สินค้าเดิม:** UPDATE เฉพาะ sync fields (ราคา, รูป, headline, บริการ ฯลฯ) — **ไม่ทับ** `description`, `key_features`, `features`, `specifications`, `faq_html`
- **ไม่ DELETE** products ที่ไม่อยู่ใน batch — ลูกค้าลบ out เองที่ `/admin/products`

## API

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/admin/import/catalog` | สแกนรายการ LG + เทียบ SKU |
| POST | `/api/admin/import/tvs-draft` | import detail เข้า draft |
| GET | `/api/admin/import/overview` | draft batch ปัจจุบัน |
| PATCH | `/api/admin/import/items/:itemId` | แก้ draft field |
| POST | `/api/admin/import/confirm` | merge เข้า products |
| DELETE | `/api/admin/import/drafts` | ลบ draft + storage mirror |

## Migration

- `0017` — DELETE ต้องมี WHERE (Supabase)
- `0018` — `promote_import_batch` แบบ merge (รัน SQL บน Supabase ก่อนใช้ปุ่ม ③)

## Storage

- Mirror รูป/วิดีโอ ตอน import → `product-images/lg-import/{batchId}/…`
- ลบ draft → ลบ mirror ของ batch (ยกเว้น path ที่ products ยังใช้)
