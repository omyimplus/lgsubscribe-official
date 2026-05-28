# Product Import Replace Workflow (Draft-First)

เอกสารนี้ใช้ล็อก flow import แบบแยกตารางก่อน promote เข้าสู่ `products`

## เป้าหมาย

สร้างปุ่มในหน้า `Import จาก LG.com` ให้ผู้ใช้กดเพื่อดึงข้อมูลจากต้นทาง แล้วทำงานแบบ:

1. นำเข้าข้อมูลใหม่เข้า `import_products` (draft แยกจาก products)
2. เมื่อชุดใหม่พร้อม กดยืนยันเพื่อแทนที่ `products` เดิมทั้งชุด

## โครงสร้างตารางที่ใช้

- `import_batches` เก็บรอบการนำเข้า
- `import_products` เก็บข้อมูลสินค้ารอ promote
- `products` เป็นตารางใช้งานจริงบนหน้าเว็บ/หลังบ้าน

## Flow ที่เข้าใจตอนนี้

1. ผู้ใช้กดปุ่ม `Import ทีวี (3 รายการ)` ในหน้า `/admin/import`
2. ระบบสร้าง batch ใหม่ใน `import_batches` (status=`draft`)
3. ระบบนำเข้าข้อมูลลง `import_products` เฉพาะ batch นั้น
4. ผู้ใช้ตรวจรายการในตาราง draft
5. ผู้ใช้กด `ยืนยันแทนที่ Products`
6. ระบบเรียกฟังก์ชัน `promote_import_batch(batch_id)` เพื่อ:
   - ลบข้อมูลใน `products` เดิมทั้งหมด
   - insert ข้อมูลจาก `import_products` ของ batch เข้า `products`
   - อัปเดต batch เป็น `promoted`
   - ลบ draft ที่ถูกย้ายแล้ว

## API ที่ใช้งานใน flow

- `POST /api/admin/import/tvs-draft`
- `GET /api/admin/import/overview`
- `POST /api/admin/import/confirm`
- `DELETE /api/admin/import/drafts`

## หมายเหตุ

- ตอนนี้เริ่มจาก TV import 3 รายการเพื่อทดสอบรอบสั้น
- สามารถขยายจำนวนรายการ/หมวดได้ภายหลังโดยใช้ flow เดิม
