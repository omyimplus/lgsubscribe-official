# LG Subscribe — Project Specification

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Website | Vue / Nuxt 4 |
| Backend Office | Vue / Nuxt 4 |
| Database | Supabase |

---

## Frontend Website (สำหรับ User)

### เมนูหลัก

1. **หน้าแรก**
2. **สินค้าทั้งหมด** (โครงสร้างตาม lg.com)
   - มาใหม่! น่าสนใจ *(Tag / curated — ไม่ใช่ category)*
   - **ทีวี & Soundbars**
     - ทีวี
     - ลำโพง Soundbars
   - **เครื่องใช้ไฟฟ้าภายในบ้าน**
     - เครื่องซักผ้า · เครื่องอบผ้า · ตู้ถนอมผ้า · ตู้เย็น
     - เครื่องดูดฝุ่น · เตาอบไมโครเวฟ · เครื่องล้างจาน · เครื่องกรองน้ำ
   - **ระบบปรับอากาศ**
     - เครื่องปรับอากาศ · เครื่องฟอกอากาศ · เครื่องลดความชื้น
   - **จอมอนิเตอร์**
     - จอมอนิเตอร์
   - *ติดต่อฝ่ายบริการ → ลิงก์หน้า ติดต่อเรา (ไม่ใช่ product category)*
3. **ความน่าเชื่อถือ**
4. **บทความ**
   - ทำไมต้อง LG Subscribe?
   - วิธีสั่งซื้อสินค้า LG Subscribe
   - สาระน่ารู้ LG Subscribe
   - FAQ - ถามตอบ
5. **เงื่อนไขการผ่อน**
   - สมัครตัวแทน
   - งานบริการ - LG Service Care
6. **ติดต่อเรา**

### ฟีเจอร์เพิ่มเติม

- ระบบ Login (ไม่บังคับ)
- ระบบ Favorite

### Product Card (ตาม lg.com — ไม่แสดงดาว rating)

| ส่วน | แหล่งข้อมูล |
|---|---|
| Badge Subscription | ค่าเริ่มต้น |
| ชื่อสินค้า (ลิงก์) | `name` |
| รหัสรุ่น + คัดลอก | `sku` |
| รูปสินค้า | `image_url` |
| ข้อความโปรโมชั่น (แดง) | `headline` |
| ราคา/เดือน | `discounted_price` หรือ `base_price` |
| ราคาเต็ม (ขีดฆ่า) | `full_price` |
| ต่อเดือน + รับประกัน | template จาก `warranty_years` |
| ส่วนลด subscription | `subscription_note` (ข้อความสั้น) |
| ซื้อเฉพาะสินค้า | `purchase_only_label` + `purchase_only_url` |
| ช่วงราคา (อื่นๆ) | `price_range` (ไม่แสดงบนการ์ด) |
| รายละเอียดภายใน | `description` (HTML editor — แท็บแยก) |

---

## Backend Office (สำหรับพนักงาน)

### ฟีเจอร์หลัก

1. **ระบบแจ้งเตือนเพื่อเข้า Line OA**
2. **User Management** (Employee, Admin)
3. **Products**
4. **Main Category** — กลุ่มเมนูระดับบน (ทีวี & Soundbars, เครื่องใช้ไฟฟ้าภายในบ้าน, …)
5. **Category** — หมวดย่อยผูกกับ Main Category (ดึงตาม lg.com)
6. **Tags** — ลดราคา, มาแรง, น่าสนใจ *(รวม "มาใหม่! น่าสนใจ")*
7. **Promotion**
8. **LG.com Import** (ดูหัวข้อ Bot API ด้านล่าง)

### Product Fields

| Field | รายละเอียด |
|---|---|
| รูปภาพ | Drag and Drop |
| ชื่อ | ชื่อสินค้า |
| รหัสสินค้า | SKU |
| ราคาหลัก | ราคาอ้างอิงหลัก |
| ราคาเต็ม | ราคาก่อนลด |
| ช่วงราคา | — |
| ราคาลด | คำนวณจากราคาหลัก (ใส่ได้เงื่อนไขเดียว) |
| ราคาลดแล้ว | ราคาสุทธิ |
| ส่วนลด % | เปอร์เซ็นต์ส่วนลด |
| หัวข้อหลัก | — |
| รายละเอียด | Editor (rich text) |

### รูปแบบบริการ

- ทำความสะอาดด้วยตนเอง
- ทำความสะอาดโดยช่างถึงบ้าน

### รอบบริการ / ระยะเวลา

| Field | รายละเอียด |
|---|---|
| รอบบริการ | จำนวนเดือน |
| ระยะเวลาผ่อน | จำนวนเดือน |
| รับประกัน | จำนวนปี |

---

## Bot API — Import Data จาก LG.com

### Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js |
| Tools | Puppeteer / Playwright |

### URL Data Source

```
https://www.lg.com/th/subscription
```

### หลักการทำงาน

1. เมื่อกด **Import** button ในระบบ backend
2. ระบบเปิด browser จำลองหลังบ้าน (headless — ไม่แสดงหน้าจอ เพื่อลดภาระ server)
3. Bot loop คลิกสินค้าแต่ละชิ้นจนครบ
4. เก็บข้อมูลต่อไปนี้จากแต่ละสินค้า:
   - รูปภาพ
   - วิดีโอ
   - คุณลักษณะสำคัญ
   - คุณสมบัติ
   - สเปค
5. **รูปภาพ:** compress + เปลี่ยนนามสกุลที่เหมาะสม ก่อน upload ขึ้น server
6. **วิดีโอ:** ไม่ลดขนาด — ประเมินที่หน้างาน
7. เมื่อ import ครบทุกรายการ ระบบสร้าง **mockup products** ใน backend (status: **pending**)
8. Admin **approve** เพื่อ publish ขึ้น production

### Flow Diagram

```
[Admin กด Import]
      │
      ▼
[Headless Browser เปิด lg.com/th/subscription]
      │
      ▼
[Loop: คลิกสินค้าแต่ละชิ้น → เก็บ data]
      │
      ├── รูป → compress → เปลี่ยนนามสกุล → เก็บที่ server
      ├── วิดีโอ → เก็บที่ server (ไม่บีบ)
      └── text data → เก็บ DB
      │
      ▼
[สร้าง Mockup Products (status: pending)]
      │
      ▼
[Admin Review → Approve → Production]
```
