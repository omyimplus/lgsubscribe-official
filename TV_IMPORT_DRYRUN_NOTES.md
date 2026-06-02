# TV Import Dry-Run Notes

รอบทดสอบเก็บข้อมูลหมวดทีวี (`/subscription/tvs`) เพื่อยืนยันแนวทาง import ก่อนเขียนเข้า DB จริง

## Result Snapshot

- Source: `https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE`
- Pagination check:
  - หน้าแรกพบสินค้า
  - `firstResult=9` ไม่พบสินค้าเพิ่ม (ตอนนี้ในหมวดทีวีมี 6 รายการ)
- Detail URL ต้องดึงจากลิงก์การ์ดสินค้าใน DOM (ไม่ควรประกอบ URL เอง)

## TV Detail URLs ที่พบ (ปัจจุบัน)

1. https://www.lg.com/th/tv-soundbars/qned-evo/85qned80bsa/lgsubscribe
2. https://www.lg.com/th/tv-soundbars/oled-evo/oled77c6psa/lgsubscribe
3. https://www.lg.com/th/tv-soundbars/qned-evo/65qned80bsa/lgsubscribe
4. https://www.lg.com/th/tv-soundbars/nano-4k-uhd/65nu855bpsa/lgsubscribe
5. https://www.lg.com/th/tv-soundbars/qned-evo/55qned80bsa/lgsubscribe
6. https://www.lg.com/th/tv-soundbars/nano-4k-uhd/43nu855bppa/lgsubscribe

## Mapping สำหรับบันทึกลงระบบเรา

- `name`: จาก `<h1>`
- `sku`: parse จากข้อความ `รุ่น <MODEL>`
- `base_price`, `full_price`: parse จากราคาในหน้า PDP (`฿...`)
- `image_urls`: ดึงจาก gallery ของ PDP (ต้องใช้ selector เฉพาะ gallery)
- `image_url`: รูปแรกของ `image_urls`
- `description`: ดึงจาก section heading ที่ตรงชื่อ
- `specifications`: inner HTML ของ `#pdp-specs-section`
- `features`: inner HTML ของ `#pdp-overview-section` (เนื้อหาคุณสมบัติทั้งก้อน รวมข้อความ)
- `key_features`: outer HTML ของ `ul#keyFeatureList` (ไม่รวมลิงก์ "เพิ่มเติม" — รายการอยู่ครบใน HTML โดยไม่ต้องกดขยาย)
- ค่าไม่พบให้เก็บ `null`

## สถานะสคริปต์

- เพิ่มสคริปต์ทดลอง: `scripts/import-lg-tvs-dryrun.mjs`
- วัตถุประสงค์: crawl list + parse detail + report (`tmp/lg-tv-dryrun*.{json,md}`)
- หมายเหตุ: selector ของหน้า PDP ยังต้องปรับละเอียดต่อเพื่อให้ดึงรูป/section ได้ครบ 100%

## แนะนำขั้นต่อไป (ก่อน import เข้า DB จริง)

1. lock selector ของ PDP gallery ให้แม่น
2. lock selector ของ section `คุณลักษณะที่สำคัญ/คุณสมบัติ/สเปค`
3. รัน dry-run แล้วตรวจ report field completeness
4. ผ่านเกณฑ์แล้วค่อยเปิดโหมด upsert DB จริง
