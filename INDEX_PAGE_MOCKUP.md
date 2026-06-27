# หน้าแรก (Index) — คู่มืออ้างอิง Mockup

> **อ่านไฟล์นี้ + เปิดรูป mockup ทุกครั้ง** ก่อนแก้ฝั่ง front ที่เกี่ยวกับหน้าแรก (`/`, layout storefront, header/footer ของร้าน)

---

## Mockup ต้นฉบับ

| รายการ | ค่า |
|--------|-----|
| **ไฟล์** | [`public/mockup/index.png`](public/mockup/index.png) |
| **หน้าเป้าหมาย** | `app/pages/index.vue` |
| **Layout** | `app/layouts/default.vue` |
| **Spec ภาพรวม** | [`PROJECT_SPEC.md`](PROJECT_SPEC.md) → Frontend Website → เมนูหลัก |

### วิธีทำงาน (ทุกครั้ง)

1. เปิด **`public/mockup/index.png`** คู่กับโค้ด
2. อ่าน section ที่จะทำในเอกสารนี้
3. เช็ค **สถานะ implementation** ด้านล่าง — อย่าทำซ้ำ / อย่าขัด mockup
4. แก้เฉพาะ section ที่ร้องขอ — อย่า refactor ส่วนอื่นโดยไม่จำเป็น
5. อัปเดต **Checklist สถานะ** ในไฟล์นี้เมื่อ section เสร็จ

---

## Design tokens (จาก mockup)

| Token | ค่า |
|-------|-----|
| สีหลัก (CTA / active) | `#ea1917` / `#E60028` |
| พื้นหลัง section | `#FFFFFF`, section บางส่วน `#F5F5F5` |
| Footer | พื้นเทาอ่อนมาก `#fafafa` ข้อความเทาเข้ม · แถบล่าง `#f3f3f3` (ไม่ใช่พื้นดำ) |
| Line CTA | เขียว Line Official |
| Font | Prompt (ตั้งใน `nuxt.config.ts` + `main.css`) |
| Container | **`index-container`** = `max-width: 1200px` (`--width-index`) — ใช้ทุก section หน้าแรก |
| Layout section | พื้นหลัง full-bleed ได้ — เนื้อหาข้างในใช้ `<div class="index-container">` |
| ปุ่มหลัก | rounded-full, พื้นแดง ขาว |

---

## โครงหน้า — บนลงล่าง (ตาม mockup)

### 1. Header (Navigation)

**Mockup**

- ซ้าย: โลโก้ LG Subscribe
- กลาง: หน้าแรก · สินค้าทั้งหมด · ความน่าเชื่อถือ · บทความ · เงื่อนไขการผ่อน · ติดต่อเรา
- ขวา: ค้นหา · ตะกร้า (badge แดง) · ไอคอนผู้ใช้
- Sticky ด้านบน, พื้นขาว, เส้นขอบล่างบาง

**โค้ด**

| ไฟล์ | หมายเหตุ |
|------|----------|
| `app/components/SiteHeader.vue` | เมนูหลัก + mobile drawer |
| `app/components/SiteHeaderAuth.vue` | `compact` = ไอคอนผู้ใช้ |
| `app/components/InterestCartButton.vue` | ตะกร้าสนใจผ่อน |
| โลโก้ | `/images/logo.webp` |

**Routes เมนู**

| เมนู | Path | หน้ามีแล้ว? |
|------|------|-------------|
| หน้าแรก | `/` | ✅ |
| สินค้าทั้งหมด | `/products` | ✅ |
| ความน่าเชื่อถือ | `/trust` | ❌ placeholder |
| บทความ | `/articles` + dropdown หมวด + `/faq` | ✅ |
| เงื่อนไขการผ่อน | `/installment` | ❌ placeholder |
| ติดต่อเรา | `/contact` | ❌ placeholder |

**สถานะ:** 🟡 Header คร่าวๆ แล้ว — ยังไม่มี dropdown สินค้าตามหมวด, ค้นหายังลิงก์ไป `/products`

---

### 2. Hero Section

**Mockup**

- รูป lifestyle สินค้า LG เต็มความกว้าง (TV, ตู้เย็น, แอร์, ฟอกอากาศ, เครื่องซัก ฯลฯ)
- หัวข้อ: **เป็นเจ้าของ LG ง่ายกว่าใคร**
- รอง: **เริ่มต้นเพียงหลักร้อย จ่ายง่ายผ่อนสบาย**
- Bullet 3 ข้อ (เครื่องหมาย ✓):
  1. นวัตกรรมสุดล้ำและดีไซน์พรีเมียม
  2. แบ่งชำระรายเดือน ราคาสบายๆ
  3. ดูแลและรับประกันตลอดอายุสัญญา
- ปุ่ม CTA แดง: **เริ่มผ่อนกับเรา >** → ลิงก์ไป `/products` หรือ flow สนใจผ่อน

**โค้ด:** `app/components/home/HomeHero.vue`

**Asset:** `/images/bg-hero-section.webp`

**สถานะ:** ✅ ทำแล้ว

---

### 3. Category Slider (เลื่อนแนวนอน)

**Mockup**

- **กล่อง** `rounded-2xl border border-gray-200` ครอบ slider ทั้งก้อน
- ลูกศร `<` `>` วงกลมซ้าย/ขวา **ในกล่อง** — slide เมื่อมีหมวดเกินความกว้าง
- แต่ละหมวด: **รูปสินค้า** (ไม่มีวงกลม/bg ด้านหลัง) + **ชื่อไทย** ใต้รูป
- รูป = สินค้า published ตัวแรกในหมวด (`/api/public/home-categories`)
- ไม่มีรูป → ข้ามหมวด

| ชื่อไทย (mockup) | slug (DB) | ไฟล์ไอคอนแนะนำ |
|------------------|-----------|----------------|
| ทีวี | `television` | `television.webp` |
| Soundbars | `soundbar` | `soundbar.webp` |
| เครื่องซักผ้า | `washing-machine` | `washing-machine.webp` |
| เครื่องอบผ้า | `dryer` | `dryer.webp` |
| ตู้เย็น | `refrigerator` | `refrigerator.webp` |
| เครื่องดูดฝุ่น | `vacuum-cleaner` | `vacuum-cleaner.webp` |
| ไมโครเวฟ | `microwave-oven` | `microwave-oven.webp` |

> DB มี **14 หมวดย่อย** ครบ — ดู seed ใน `0005_seed_lg_menu.sql` และตารางใน [`PRODUCTS_FIELD_GUIDE.md`](PRODUCTS_FIELD_GUIDE.md) / migration seed

**Data:** `GET /api/public/home-categories` — รวม logic ฝั่ง server (ดูด้านล่าง)

> **Network tab:** Nuxt โหลด API ตอน SSR แล้วฝังใน HTML (`payload` key `public-home-categories`) — มัก**ไม่เห็น** request แยก `/api/public/home-categories` ใน Fetch/XHR ตอนเปิดหน้าแรก ให้ดูที่ request `localhost/` (Document) หรือเปิด URL API ตรงๆ

**Logic DB (สรุป):**

1. `main_categories` + `categories` ที่ `is_active = true` — เรียงตาม `sort_order`
2. `products` ที่ `status = 'published'` และ `is_active = true`
3. ต่อหมวด: เอาสินค้าที่ `category_id` ตรง → เรียง `sort_order`, `name` → รูปจาก `image_urls[0]` หรือ `image_url`
4. ไม่มีรูป → ไม่ส่งหมวดนั้นใน response

**โค้ด:** `server/api/public/home-categories.get.ts` + `HomeCategorySlider.vue`

**ลิงก์:** `/products?category={slug}` (filter ยังต้องทำที่ PLP ถ้ายังไม่มี)

**สถานะ:** ✅ ทำแล้ว

---

### 4. แบนเนอร์กลาง (2 คอลัมน์)

**Mockup**

- กล่องใน **`index-container`** (ไม่ full bleed)
- **ซ้าย:** รูป `public/images/event_add_line.webp`
- **ขวา:** ข้อความสั้น — ชวนสอบถามผ่าน Line + ปุ่ม **เพิ่ม Line เพื่อสอบถาม**

**โค้ด:** `app/components/home/HomeBannerPair.vue`

**สถานะ:** ✅ ทำแล้ว

---

### 5. โปรโมชั่นเดือนนี้สำหรับคุณ

**Mockup**

- หัวข้อ section
- การ์ด slider — **รูปแบนเนอร์อย่างเดียว** (ไม่แสดงหัวข้อใต้รูป)
- รูปเต็มการ์ด อัตราส่วน **2:1** (ไม่มีป้าย LG Subscribe ทับรูป)
- คลิกไปหน้ารายละเอียดโปร

**Data:** `GET /api/public/promotions` — ใช้ `promotionBannerSrc()` จาก `shared/utils/promotionDisplay.ts`

**Component อ้างอิง:** `app/pages/promotions/index.vue`

**โค้ด:** `HomePromotions.vue` + `HomePromotionCard.vue` — slider 2 ใบต่อแถว (เลื่อนถ้ามากกว่า 2)

**สถานะ:** ✅ ทำแล้ว

---

### 6. สินค้าแนะนำสำหรับเดือนนี้

**Mockup**

- Grid **4 การ์ด**
- แต่ละการ์ด: รูป · badge ขนาด (43"/65" ถ้ามี variant) · ชื่อรุ่น
- ปุ่ม 2 ปุ่ม: **แผนการชำระ** (outline) · **เลือกสินค้า** (แดง)

**Data:** `GET /api/public/featured-products` — สินค้า `published` ที่ติดแท็ก **สินค้าแนะนำ** (`slug: home-featured`) แล้ว `groupProducts()`

**Component:** `ProductStorefrontCard.vue` (ใช้ร่วมกับ `/products` ผ่าน `ProductGroupCard.vue`)

**Admin:** ตั้งแท็ก **สินค้าแนะนำ** ที่ฟอร์มสินค้า — migration `0035_home_featured_tag.sql`

**UI:** slider แถวเดียว แสดง **4 ชิ้น** — เลื่อนอัตโนมัติทุก 5 วินาทีถ้ามากกว่า 4 (หยุดเมื่อ hover / กดลูกศร)

**สถานะ:** ✅ ตามแท็ก + slider

---

### 7. บทความแนะนำจาก LG Subscribe

**Mockup**

- Grid **4 การ์ด** — หมวด **สาระน่ารู้** เท่านั้น
- กราฟิก: “เพียงแค่ ซับ ก็ใช้สินค้า LG ได้”

**Data:** `GET /api/public/articles/featured` — เฉพาะหมวด **สาระน่ารู้** (`knowledge`) สูงสุด **4** ชิ้น

**โค้ด:** `HomeArticles.vue` + `ArticleCard.vue` · หน้าร้าน `/articles`, `/articles/[slug]`

**Admin:** `/admin/articles` — migration `0033_articles.sql`

**สถานะ:** ✅ CMS บทความ

---

### 8. LG Subscribe Customer Experiences

**Mockup**

- หัวข้อ (mockup พิมพ์ "Sububscribe" — ใช้ **Subscribe** ในโค้ด)
- แถวรูป 4 ช่อง (event / review)

**Data:** static gallery หรือ CMS ภายหลัง

**โค้ด:** `app/components/home/HomeExperiences.vue` — placeholder 4 ช่อง

**สถานะ:** 🟡 UI ตาม mockup — รอรูป/event จริง

---

### 9. Footer

**Mockup**

- พื้น **เทาอ่อนมาก** (`#fafafa`) ข้อความเทาเข้ม — **ไม่ใช่พื้นดำ**
- ซ้าย: Logo สีปกติ + คำอธิบาย + social วงกลมขาวขอบเทา (Facebook, Line, Instagram, YouTube)
- คอลัมน์: สินค้า · บริการ · ช่วยเหลือ · **ติดต่อ** (โทร / เวลา / Line)
- แถบล่างสุด: `#f3f3f3` + © LG Subscribe-Official

**โค้ด:** `app/components/SiteFooter.vue` — ใน `app/layouts/default.vue`

**สถานะ:** ✅ ทำแล้ว

---

## แผนผัง component (เป้าหมาย)

```
app/pages/index.vue
├── (ทุก section ใช้ class `index-container` หรือ wrapper full-bleed + index-container ด้านใน)
├── HomeHero.vue              ← section 2
├── HomeCategorySlider.vue    ← section 3
├── HomeBannerPair.vue        ← section 4
├── HomePromotions.vue        ← section 5
├── HomeFeaturedProducts.vue  ← section 6
├── HomeArticles.vue          ← section 7
└── HomeExperiences.vue       ← section 8

app/layouts/default.vue
├── SiteHeader.vue            ← section 1 ✅ คร่าวๆ
├── <slot />                  ← index sections
├── SiteFooter.vue            ← section 9
└── InterestCartPanel.vue
```

---

## Checklist สถานะ (อัปเดตเมื่อทำเสร็จ)

| # | Section | สถานะ |
|---|---------|--------|
| 1 | Header | 🟡 คร่าวๆ |
| 2 | Hero | ✅ |
| 3 | Category slider | ✅ |
| 4 | Banner 2 คอลัมน์ | ✅ |
| 5 | โปรโมชั่นเดือนนี้ | ✅ |
| 6 | สินค้าแนะนำ | ✅ |
| 7 | บทความแนะนำ | ✅ |
| 8 | Customer Experiences | 🟡 placeholder |
| 9 | Footer | ✅ |

---

## สิ่งที่ **ไม่** อยู่ใน mockup แต่มีในโค้ด

- เมนู **โปรโมชั่น** ใน header เดิม — mockup ไม่มี (โปรอยู่ section 5 ในหน้าแรก + อาจมีลิงก์ใน footer)
- หมวด **มาใหม่! น่าสนใจ** — เป็น tag ไม่ใช่ category (`PROJECT_SPEC.md`)

---

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | บทบาท |
|------|--------|
| `public/mockup/index.png` | **Mockup ต้นฉบับ — เปิดทุกครั้ง** |
| `public/images/logo.webp` | โลโก้ header |
| `app/pages/index.vue` | หน้าแรก |
| `app/layouts/default.vue` | Layout ร้าน |
| `supabase/migrations/0005_seed_lg_menu.sql` | หมวดสินค้า / main category |
| `server/api/public/featured-products.get.ts` | สินค้าแนะนำ (แท็ก home-featured) |
| `server/api/public/promotions/index.get.ts` | โปรโมชั่น |

---

*อัปเดตล่าสุด: 2026-06 — sections 4–9 บน index + SiteFooter*
