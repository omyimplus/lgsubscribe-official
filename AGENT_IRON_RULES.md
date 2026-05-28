# Agent Iron Rules (Project-Level)

เอกสารกฎเหล็กกลางสำหรับงานในโปรเจกต์นี้ (ใช้กับ AI Agent ทุกครั้ง)

## Core Rules

1. เมื่อมีการเปลี่ยนแปลงโครงสร้างข้อมูล (DB/table/column/relationship) ไม่ว่าจะเพิ่ม แก้ไข หรือลบ:
   - ต้องอัปเดตเอกสารที่เกี่ยวข้องทันทีในรอบงานเดียวกัน
   - ถ้ามีการลบตารางหรือคอลัมน์ ต้องลบ/ปรับเอกสารที่อธิบายส่วนนั้นด้วย
2. ก่อนเริ่มแก้โค้ดที่เกี่ยวข้องกับข้อมูลสินค้า:
   - ต้องอ่าน `PRODUCTS_FIELD_GUIDE.md` ก่อนเสมอ
3. ถ้าแก้ logic ที่ซับซ้อน/ชวนสับสน:
   - ต้องสร้างหรืออัปเดตเอกสารอธิบาย flow การทำงาน
4. เอกสารต้องสื่อสารได้กับทั้ง dev และคนทำ data/import:
   - ระบุ field, mapping, source, และข้อควรระวังให้ชัด

## Mandatory Pre-Change Checklist

- อ่าน `PRODUCTS_FIELD_GUIDE.md`
- ตรวจว่ามี migration ใหม่หรือไม่
- ถ้ามี logic ซับซ้อนใหม่ ให้เตรียมไฟล์ MD อธิบาย flow

## Mandatory Post-Change Checklist

- อัปเดต `PRODUCTS_FIELD_GUIDE.md` ให้ตรง state ล่าสุด
- อัปเดต/เพิ่ม MD อธิบาย logic ที่แก้
- ตรวจว่า field ใน DB, API, admin form, และ frontend page ตรงกัน
