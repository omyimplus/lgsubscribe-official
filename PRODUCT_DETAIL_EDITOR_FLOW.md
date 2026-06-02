# Product Detail Editor Flow

เอกสารนี้อธิบาย logic การแก้ไขเนื้อหา detail ของสินค้าในหน้า `/admin/products/[id]` (ส่วนที่มีความซับซ้อน)

## เป้าหมาย

- แยกการแก้ไขเนื้อหาออกเป็นส่วนย่อยและแยก "หน้าแก้ไข" ต่อ field
- รองรับ rich content พร้อมแทรกรูป/วิดีโอ
- อัปโหลด media ไป Supabase Storage bucket `product-images` (`editor/images/`, `editor/videos/`)

## Components ที่เกี่ยวข้อง

- `app/components/admin/product/FormDetail.vue`
  - แสดงปุ่มแยกสำหรับ `description`, `key_features`, `features`, `specifications`
  - กดแล้วไปหน้า `/admin/products/:id/detail/:field`
- `app/pages/admin/products/[id]/detail/[field].vue`
  - หน้าแก้ไขแยก field แบบเต็มจอ
  - ใช้ `AdminProductRichFieldEditor` + ปุ่มบันทึกเฉพาะ field
- `app/components/admin/product/RichFieldEditor.client.vue`
  - ใช้ `@vueup/vue-quill`
  - ปุ่มแทรกรูป/วิดีโอเรียก `/api/editor/upload-media`
- `app/composables/useAdminProductForm.ts`
  - `saveSingleDetailField(field)` สำหรับ patch เฉพาะคอลัมน์เดียว
- `server/api/editor/upload-media.post.ts`
  - รับไฟล์ multipart แล้วอัปโหลดไป Supabase (`server/utils/editorMediaStorage.ts`)

## Save Flow (แยก field)

1. ผู้ใช้กดปุ่ม `เพิ่ม/แก้ไข` ของ field ใด field หนึ่ง
2. ระบบเปิดหน้าใหม่ `/admin/products/:id/detail/:field`
3. ผู้ใช้แก้ไข/แทรกรูป/แทรกวิดีโอ
4. กดบันทึก -> เรียก `saveSingleDetailField(field)`
5. API `PATCH /api/products/:id` อัปเดตเฉพาะคีย์นั้น

## Media Upload Flow

1. กดปุ่ม `แทรกรูป` หรือ `แทรกวิดีโอ`
2. เรียก `POST /api/editor/upload-media`
3. API ตรวจประเภท/ขนาดไฟล์
4. อัปโหลดไป `product-images/editor/images/` หรือ `editor/videos/`
5. ส่ง public URL กลับ (เช่น `https://…supabase.co/storage/v1/object/public/product-images/editor/videos/…`)
6. Editor แทรก `<img>` หรือ `<video><source …></video>` ลงใน HTML content

## Import Draft Item (แยกหน้าเดียวกัน)

ใช้ pattern เดียวกับ products แต่บันทึกลง `import_products`:

- `app/pages/admin/import-items/[itemId].vue` + `AdminImportFormDetail`
- `app/pages/admin/import-items/[itemId]/detail/[field].vue`
- `app/components/admin/import/HtmlFieldEditor.client.vue` — **TinyMCE** WYSIWYG + ปุ่ม **แทรกรูป/แทรกวิดีโอ** (`/api/editor/upload-media`) + plugin `media` (embed URL) — ไม่ใช้ Quill เพราะตัด LG markup
- `app/composables/useAdminImportItemForm.ts` → `PATCH /api/admin/import/items/:itemId` (`server: false` บน useFetch)
- รองรับ field: `key_features`, `features`, `specifications`, `faq_html`

## ข้อควรระวัง

- วิดีโอ/รูปจาก editor ใช้ public URL ของ Supabase — ต้องตั้ง bucket `product-images` เป็น public read
- วิดีโอสั้น ≤25MB; รูป ≤8MB
