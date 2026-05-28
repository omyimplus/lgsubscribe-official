# LG Subscription Source URLs (TH)

รายการ URL ต้นทางสำหรับทำ bot/import ข้อมูลสินค้า LG Subscribe (ประเทศไทย)

> อัปเดตล่าสุด: 2026-05-28  
> หมายเหตุ: ตัดหน้า `ติดต่อเรา` ออกตาม requirement

## Pagination Rule (สำคัญ)

- LG ใช้ query param `firstResult` เป็น offset สำหรับหน้าถัดไป
- ตัวอย่าง:
  - หน้าแรก: `https://www.lg.com/th/subscription/refrigerators/?ec_model_status_code=ACTIVE`
  - หน้า 2: `https://www.lg.com/th/subscription/refrigerators/?ec_model_status_code=ACTIVE&firstResult=9`
- แนวทางบอท:
  - เริ่มที่หน้าแรก (ไม่มี `firstResult`)
  - วน `firstResult=9,18,27,...` จนไม่เจอสินค้าใหม่

## Detail URL Rule (สำคัญมาก)

- **ห้ามประกอบ URL หน้ารายละเอียดเอง**
- ให้บอทเปิดหน้า list แล้วดึงลิงก์สินค้าจริงจาก DOM ของการ์ดสินค้า
- เหตุผล: path ของ detail มี slug เฉพาะรุ่นและโครงสร้างอาจเปลี่ยนได้
- ตัวอย่าง URL detail:
  - `https://www.lg.com/th/tv-soundbars/oled-evo/oled65c6psa/lgsubscribe/`

## Main

- ทั้งหมด: https://www.lg.com/th/subscription/all/?ec_model_status_code=ACTIVE

## ทีวี / เครื่องเสียง

- โทรทัศน์: https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE
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

