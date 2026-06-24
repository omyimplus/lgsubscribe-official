# LG Subscription Source URLs (TH)

รายการ URL ต้นทางสำหรับทำ bot/import ข้อมูลสินค้า LG Subscribe (ประเทศไทย)

> อัปเดตล่าสุด: 2026-05-28  
> หมายเหตุ: ตัดหน้า `ติดต่อเรา` ออกตาม requirement  
> โค้ดอ้างอิง: `server/utils/lgSubscriptionSources.ts` (URL + pagination + variant selector ต่อหมวด)

## Pagination Rule (สำคัญ)

- LG ใช้ query param `firstResult` เป็น offset สำหรับหน้าถัดไป
- ตัวอย่าง:
  - หน้าแรก: `https://www.lg.com/th/subscription/refrigerators/?ec_model_status_code=ACTIVE`
  - หน้า 2: `https://www.lg.com/th/subscription/refrigerators/?ec_model_status_code=ACTIVE&firstResult=9`
- แนวทางบอท:
  - เริ่มที่หน้าแรก (ไม่มี `firstResult`)
  - วน `firstResult=9,18,27,...` จนไม่เจอสินค้าใหม่

## ⚠️ Anti-bot / Access Denied (Akamai)

- LG ใช้ **Akamai Bot Manager** — Playwright **headless เบื้องหลัง** โดน `Access Denied` ได้บ่อยและซ้ำ
- มี stealth + retry/backoff + ตรวจจับ Access Denied ใน `server/utils/lgTvImport.ts` แล้ว (ดูรายละเอียดใน `PROJECT_HANDOFF.md` หัวข้อ "Access Denied")
- ถ้าโดนทุกครั้ง: พิจารณา **headful / Xvfb**, `playwright-extra` stealth plugin, หรือ proxy หมุน IP
- อย่ายิง scan รัว ๆ — เว้นช่วงให้ IP เย็นลง; import ใช้ catalog items ที่ scrape แล้ว (ไม่เปิด PLP ซ้ำ)

## Detail URL Rule (สำคัญมาก)

- **ห้ามประกอบ URL หน้ารายละเอียดเอง**
- ให้บอทเปิดหน้า list แล้วดึงลิงก์สินค้าจริงจาก DOM ของการ์ดสินค้า
- เหตุผล: path ของ detail มี slug เฉพาะรุ่นและโครงสร้างอาจเปลี่ยนได้
- ตัวอย่าง URL detail:
  - `https://www.lg.com/th/tv-soundbars/oled-evo/oled65c6psa/lgsubscribe/`

## Main

- ทั้งหมด: https://www.lg.com/th/subscription/all/?ec_model_status_code=ACTIVE

## Variant chips บนการ์ด (ทีวี + แอร์ DOM เดียวกัน)

- Container: `.neo-card--sibling.type-inch` (ชื่อ class เป็น inch แต่แอร์ใส่ข้อความ BTU ได้)
- ปุ่ม: `button.swatch[data-model-id]`
- ทีวีตัวอย่าง:
  - `data-model-id="OLED77C6PSA.ATM.EATH.TH.C"` + span `77"` (นิ้ว)
  - `OLED65C6PSA…` / `OLED48C6PSA…`
- แอร์ตัวอย่าง:
  - `data-model-id="SIQ13B.S01.EATH.TH.C"` + span `12000 BTU`
- บอท (catalog): คลิกทุก swatch → อ่านป้ายนิ้ว/BTU + ราคารายเดือนจาก DOM — **ไม่ merge API เป็นรายการ**
- รายละเอียดเต็ม (import): **1 การ์ด PLP = 1 ชุดรายละเอียดร่วม** — หลาย SKU/ขนาดจอใช้ PDP เดียวกัน (ลอง URL ในกลุ่มจนเจอที่ไม่ 404); ราคา/SKU/ป้ายนิ้วยังแยกต่อ swatch
- URL ต่อ variant: จากปุ่ม `.neo-card--ufn a[href*="/lgsubscribe"]` หรือ attribute บน swatch — **ห้ามสร้าง slug จาก SKU**
- SKU สั้น: ตัด suffix `.ATM.EATH.TH.C` จาก `data-model-id` ได้เช่น `OLED65C6PSA`

## ทีวี / เครื่องเสียง

- ทีวี: https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE
- ลำโพง Soundbars: https://www.lg.com/th/subscription/soundbars/?ec_model_status_code=ACTIVE

## เครื่องใช้ไฟฟ้าภายในบ้าน

- เครื่องซักผ้า: https://www.lg.com/th/subscription/washers/?ec_model_status_code=ACTIVE
- เครื่องอบผ้า: https://www.lg.com/th/subscription/dryers/?ec_model_status_code=ACTIVE
- ตู้ถนอมผ้า: https://www.lg.com/th/subscription/styler/?ec_model_status_code=ACTIVE
- ตู้เย็น: https://www.lg.com/th/subscription/refrigerators/?ec_model_status_code=ACTIVE
- เครื่องดูดฝุ่น: https://www.lg.com/th/subscription/vacuum-cleaners/?ec_model_status_code=ACTIVE
- ไมโครเวฟ: https://www.lg.com/th/subscription/microwave-ovens/
- เครื่องล้างจาน: https://www.lg.com/th/subscription/dishwashers/?ec_model_status_code=ACTIVE
- เครื่องกรองน้ำ: https://www.lg.com/th/subscription/water-purifiers/?ec_model_status_code=ACTIVE

## ระบบปรับอากาศ

- เครื่องปรับอากาศ: https://www.lg.com/th/subscription/air-conditioners/?ec_model_status_code=ACTIVE
- เครื่องฟอกอากาศ: https://www.lg.com/th/subscription/air-purifiers/?ec_model_status_code=ACTIVE
- เครื่องลดความชื้น: https://www.lg.com/th/subscription/dehumidifier/

## คอมพิวเตอร์

- จอมอนิเตอร์: https://www.lg.com/th/subscription/monitors/?ec_model_status_code=ACTIVE

