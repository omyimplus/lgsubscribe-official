# Product Detail Editor Flow

เอกสารนี้อธิบาย logic การแก้ไขเนื้อหา detail ของสินค้าในหน้า `/admin/products/[id]` (ส่วนที่มีความซับซ้อน)

## เป้าหมาย

- แยกการแก้ไขเนื้อหาออกเป็นส่วนย่อยและแยก "หน้าแก้ไข" ต่อ field
- รองรับ rich content พร้อมแทรกรูป/วิดีโอ
- อัปโหลด media ลง localhost ก่อน (`public/uploads/editor`)

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
  - รับไฟล์ multipart แล้วบันทึกลง `public/uploads/editor`

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
4. เขียนไฟล์ลง `public/uploads/editor`
5. ส่ง URL กลับ เช่น `/uploads/editor/<filename>`
6. Editor แทรก embed ลงใน HTML content

## ข้อควรระวัง

- media ที่อยู่ใน localhost จะไม่ข้ามเครื่องอัตโนมัติ
- ถ้าจะขึ้น production ต้องเปลี่ยน flow upload ไป storage จริง (เช่น Supabase Storage)
