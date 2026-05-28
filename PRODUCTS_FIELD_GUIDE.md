# Products Field Guide (LG Subscribe)

เอกสารนี้สรุปโครงสร้างข้อมูล `products` ล่าสุดของโปรเจกต์ เพื่อใช้อ้างอิงตอนกรอกข้อมูลเองและตอนทำ LG.com import/bot scraping

---

## 1) Scope ปัจจุบัน

- รองรับสินค้า 1 รายการต่อ 1 แถวใน `public.products`
- รองรับรูปหลายรูป (`image_urls`) และรูปหลัก (`image_url`)
- รองรับเนื้อหา detail page:
  - `description`
  - `key_features` (คุณลักษณะที่สำคัญ)
  - `features` (คุณสมบัติ)
  - `specifications` (สเปค)
- รองรับ tags ผ่าน `public.product_tags` (many-to-many)

---

## 2) Migrations ที่เกี่ยวข้อง

- `0008_products.sql` - ตาราง `products` และ `product_tags`
- `0010_product_card_notes.sql` - ฟิลด์ข้อความใต้ราคาในการ์ด
- `0012_product_detail_fields.sql` - `image_urls`, `features`, `specifications`
- `0013_product_key_features.sql` - `key_features`
- `0014_product_faqs.sql` - `faq_html` (simple mode)
- `0015_drop_product_faqs.sql` - ลบตาราง `product_faqs` (ตัดโหมดรายข้อ)
- `0016_import_batches.sql` - ตาราง `import_batches` และ `import_products` สำหรับ draft ก่อน promote

> ต้องรัน migration ตามลำดับ

---

## 3) Field Dictionary (products)

## ตารางคอลัมน์ทั้งหมด (พร้อมคำแปล)

| Column | คำแปลไทย | Type | หมวด | ใช้ทำอะไร |
|---|---|---|---|---|
| `id` | รหัสสินค้า | `uuid` | Identity | Primary key ของสินค้า |
| `category_id` | รหัสหมวดย่อย | `uuid` | Identity | FK ไป `categories.id` |
| `name` | ชื่อสินค้า | `text` | Identity | ชื่อที่แสดงหน้าเว็บ |
| `sku` | รหัสรุ่นสินค้า | `text (unique)` | Identity | รหัสอ้างอิง/กันข้อมูลซ้ำ |
| `headline` | ข้อความโปรโมชัน | `text \| null` | Card | ข้อความสีแดงบนการ์ด |
| `image_url` | รูปหลัก | `text \| null` | Card | รูปหลักของการ์ด (เอารูปแรกจาก `image_urls`) |
| `image_urls` | รูปสินค้าทั้งหมด | `jsonb` (`string[]`) | Card/Detail | เก็บรูปหลายรูปตามลำดับ |
| `base_price` | ราคา/เดือนตั้งต้น | `numeric` | Pricing | ราคาหลักในการคำนวณ |
| `full_price` | ราคาเต็มก่อนลด | `numeric \| null` | Pricing | ใช้แสดงราคาเดิมขีดฆ่า |
| `price_range` | ช่วงราคา | `text \| null` | Pricing | ข้อมูลราคาเสริม (ไม่แสดงบนการ์ดหลัก) |
| `subscription_note` | ข้อความใต้ราคา (สมัคร) | `text \| null` | Card | เช่น “ส่วนลด 6 เดือนเท่านั้น” |
| `purchase_only_label` | ข้อความลิงก์ซื้อขาด | `text \| null` | Card | ข้อความ CTA ซื้อเฉพาะสินค้า |
| `purchase_only_url` | URL ลิงก์ซื้อขาด | `text \| null` | Card | ปลายทางของ `purchase_only_label` |
| `discount_type` | ประเภทส่วนลด | `'amount' \| 'percent' \| null` | Pricing | ใช้กำหนดรูปแบบคำนวณส่วนลด |
| `discount_value` | มูลค่าส่วนลด | `numeric \| null` | Pricing | ค่าส่วนลดตาม `discount_type` |
| `discounted_price` | ราคาหลังลด | `numeric \| null` | Pricing | คำนวณโดย backend |
| `discount_percent` | เปอร์เซ็นต์ส่วนลด | `numeric \| null` | Pricing | คำนวณโดย backend |
| `service_self_clean` | บริการทำความสะอาดด้วยตนเอง | `boolean` | Service | เปิด/ปิดตัวเลือกบริการ |
| `service_technician` | บริการช่างถึงบ้าน | `boolean` | Service | เปิด/ปิดตัวเลือกบริการ |
| `service_months` | รอบบริการ (เดือน) | `int \| null` | Service | ระยะรอบบริการ |
| `installment_months` | ระยะเวลาผ่อน (เดือน) | `int \| null` | Service | จำนวนเดือนผ่อน |
| `warranty_years` | ระยะเวลารับประกัน (ปี) | `int \| null` | Service | ใช้สร้างข้อความรับประกันบนการ์ด |
| `description` | รายละเอียดสินค้า | `text \| null` | Detail | เนื้อหาอธิบายภาพรวมสินค้า |
| `key_features` | คุณลักษณะที่สำคัญ | `text \| null` | Detail | ไฮไลต์สำคัญของสินค้า |
| `features` | คุณสมบัติ | `text \| null` | Detail | ข้อมูลคุณสมบัติเชิงใช้งาน |
| `specifications` | สเปคทางเทคนิค | `text \| null` | Detail | ข้อมูลสเปคละเอียด |
| `faq_html` | FAQ แบบ HTML | `text \| null` | FAQ | เก็บ FAQ ทั้งก้อนเป็น HTML 1 ชุดต่อสินค้า |
| `status` | สถานะสินค้า | `'draft' \| 'published' \| 'pending'` | Workflow | สถานะงานและการเผยแพร่ |
| `sort_order` | ลำดับแสดงผล | `int` | Workflow | ควบคุมลำดับรายการ |
| `is_active` | เปิดใช้งาน | `boolean` | Workflow | ปิด/เปิดการแสดงผล |
| `created_at` | วันที่สร้าง | `timestamptz` | Audit | เวลาเพิ่มสินค้า |
| `updated_at` | วันที่แก้ไขล่าสุด | `timestamptz` | Audit | เวลาแก้ไขล่าสุด |

## ตารางสัมพันธ์ (Relation)

| Table | Column | คำแปลไทย | ใช้ทำอะไร |
|---|---|---|---|
| `product_tags` | `product_id` | รหัสสินค้า | อ้างอิงไป `products.id` |
| `product_tags` | `tag_id` | รหัสแท็ก | อ้างอิงไป `tags.id` |

---

## 4) LG.com Mapping (แนวทางดึงข้อมูล)

หมายเหตุ: selector จริงจะกำหนดตอนทำ bot/import แต่ mapping เชิงความหมายให้ยึดตามนี้

- ชื่อสินค้า -> `name`
- รหัสรุ่น -> `sku`
- รูปหลัก hero -> `image_urls[0]` และ `image_url`
- รูป gallery thumbnails ทั้งหมด -> `image_urls[]` (เรียงตามหน้าเว็บ)
- ข้อความโปรโมชัน -> `headline`
- ราคาโปรโมชัน/เดือน -> `base_price` หรือ `discounted_price` ตามเงื่อนไขธุรกิจ
- ราคาเต็ม (ถ้ามี) -> `full_price`
- คุณลักษณะที่สำคัญ -> `key_features`
- คุณสมบัติ -> `features`
- สเปค -> `specifications`
- รายละเอียดเนื้อหาอื่น -> `description`
- FAQ -> `faq_html`

---

## 5) Admin UI Mapping

## Tab: ข้อมูลสินค้า

- ชื่อสินค้า -> `name`
- SKU -> `sku`
- หมวดหมู่ -> `category_id`
- รูปสินค้า (drag/drop หลายรูป) -> `image_urls`, `image_url`
- หัวข้อโปรโมชัน -> `headline`
- ราคาทั้งหมด -> `base_price`, `full_price`, `discount_*`
- ใต้ราคา -> `subscription_note`, `purchase_only_label`, `purchase_only_url`
- บริการ/ระยะเวลา -> `service_*`, `installment_months`, `warranty_years`
- Tags -> `product_tags`
- สถานะ -> `status`, `sort_order`, `is_active`

## Tab: รายละเอียดภายใน

- รายละเอียดสินค้า -> `description`
- คุณลักษณะที่สำคัญ -> `key_features`
- คุณสมบัติ -> `features`
- สเปค -> `specifications`
- FAQ แบบ html ยกทั้งก้อน -> `faq_html`

---

## 6) API Contracts (ปัจจุบัน)

- `GET /api/products` -> list products (admin)
- `POST /api/products` -> create product
- `GET /api/products/:id` -> get product
- `PATCH /api/products/:id` -> update product
- `DELETE /api/products/:id` -> delete product
- `POST /api/products/upload-image` -> upload single image to Supabase Storage
- `POST /api/editor/upload-media` -> upload media for rich editor (localhost)
- `GET /api/public/products` -> published products for frontend
- `POST /api/admin/import/tvs-draft` -> import ทีวี 3 รายการเป็น draft (ทดสอบ)
- `GET /api/admin/import/overview` -> ดู draft batch และรายการใน import
- `POST /api/admin/import/confirm` -> ยืนยันแทนที่ products ด้วย import draft
- `DELETE /api/admin/import/drafts` -> ลบดราฟ import ทั้งหมด

---

## 7) Rules ตอนทำ Import จาก LG.com

- บังคับ normalize URL รูปให้เป็น public URL ที่ใช้งานได้จริงก่อนบันทึก
- ถ้าดึงรูปได้หลายรูป ให้เก็บครบใน `image_urls` และตั้งรูปแรกเป็น `image_url`
- ถ้า section ใดไม่พบ ให้เก็บ `null` (ห้ามเดาเนื้อหา)
- คงค่า `sku` เป็น unique key หลักในการกันข้อมูลซ้ำ
- ค่า markdown/list จากหน้าเว็บสามารถเก็บเป็น plain text แบบขึ้นบรรทัดใหม่ใน `key_features`, `features`, `specifications`

---

## 8) Suggested Next (ยังไม่ทำ)

- เพิ่ม parser แปลง bullet list จาก LG.com ให้สม่ำเสมอ
- เพิ่ม field สำหรับวิดีโอ (ถ้าจะใช้จริง)
- เพิ่มตาราง raw import log สำหรับ trace ว่าดึงจาก URL ไหน เวลาใด
