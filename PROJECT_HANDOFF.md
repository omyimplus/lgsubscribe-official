# LG Subscribe — สรุปโปรเจกต์ (Handoff สำหรับ Chat ใหม่)

> อ่านไฟล์นี้ก่อนเริ่มงานต่อ แล้วอ้างอิง MD อื่นตามหัวข้อด้านล่าง

---

## โปรเจกต์คืออะไร

เว็บ **LG Subscribe (ไทย)** — clone/workflow คล้าย [lg.com/th/subscription](https://www.lg.com/th/subscription/)  
- **Frontend**: ลูกค้าดูสินค้า / สมัครสมาชิก / จัดการบัญชี  
- **Admin**: จัดการสินค้า, หมวด, tags, ผู้ใช้, **Import จาก LG.com**

| Layer | Tech |
|--------|------|
| App | Nuxt 4 + Vue 3 |
| DB / Auth | Supabase |
| Import scraper | Playwright (headless + stealth) |
| Node | 22+ (`.nvmrc`) |

```bash
npm run dev   # http://localhost:3000
```

---

## สิ่งที่ทำเสร็จแล้ว (ภาพรวม)

### Admin
- Login + role: `admin` / `employee` (Supabase `user_metadata.role`)
- หน้า: Dashboard, Categories, Tags, Products (CRUD + rich detail editors), Users (`admin` only), Import LG.com, Customers
- Middleware: `admin-auth`, `admin-role`

### Products (ตาราง `products`)
- รูปหลายรูป (`image_urls`), rich text: `description`, `key_features`, `features`, `specifications`, `faq_html`
- แก้ detail แยกหน้า: `/admin/products/[id]/detail/[field]`
- ฟิลด์การ์ด/ราคา: `base_price`, `full_price`, `headline`, `subscription_note`, `warranty_years`, `purchase_only_*`

### Customer (Frontend)
- Register / Login (`/auth/register`, `/auth/login`) — ยืนยันอีเมลอัตโนมัติผ่าน admin API
- โปรไฟล์: `customer_profiles` + `/api/me/profile`
- ตะกร้า → **ดาวน์โหลด PDF ตารางผ่อน** (admin ดาวน์โหลดตรง / ลูกค้ากรอกอีเมลรับ PDF)
- API: `POST /api/public/cart-installment-schedule-pdf` · อีเมลผ่าน **Brevo SMTP** (`NUXT_SMTP_*`)
- Admin รายการอีเมลลูกค้า: `/admin/cart-pdf-email-leads` · ตาราง `cart_pdf_email_leads`

### Import LG.com (Draft-first)
- ตาราง: `import_batches`, `import_products` + SQL `promote_import_batch`
- หน้า: `/admin/import` — Import ทีวี (3 รายการ), ยืนยันแทนที่, ลบ draft
- ดู draft รายตัว: `/admin/import-items/[itemId]`

---

## LG TV Import — สถานะล่าสุด (สำคัญ)

### Flow ปัจจุบัน

1. **List page (Playwright)** — เปิด  
   `https://www.lg.com/th/subscription/tvs/?ec_model_status_code=ACTIVE`  
   รอ render ราคา (retry สูงสุด 3 รอบ, timeout ~60s/รอบ)
2. **DOM-first ต่อการ์ด** — อ่านจาก `li.c-product-list__item.neo-card` (ไม่ hardcode URL แล้ว)
3. **Detail page** — `$fetch` HTML แต่ละ `/lgsubscribe` สำหรับ description, features, specs, FAQ, รูป
4. **Merge** — ราคา/โปรจาก list card มี priority กว่า detail; ค่า `0` ไม่ทับค่าที่ดีกว่า
5. **Detail fields** — `key_features` จาก `ul#keyFeatureList`; `features` จาก `#pdp-overview-section`; `specifications` จาก `#pdp-specs-section`
6. **Sanitize HTML** — ตัด class/id/data-* LG ก่อนเก็บ DB (`server/utils/sanitizeLgHtml.ts`, ดู `LG_HTML_SANITIZE.md`)
7. **Mirror รูป** — ดาวน์โหลดรูปจาก LG -> WebP/resize -> อัปโหลด Supabase `product-images` (`server/utils/lgImageMirror.ts`)
8. **บันทึก** — `import_products` ใน batch `draft`

### Selector การ์ด (ยึดจากหน้าจริง)

| Field | Selector |
|--------|-----------|
| การ์ด | `li.c-product-list__item.neo-card` |
| URL | `.neo-card--ufn a[href*="/lgsubscribe"]` |
| ชื่อ | `h3` ใน card |
| SKU | `.neo-card--sku .btn-copy` |
| ราคาลด (base) | `.neo-price--price .cell-price` |
| ราคาเต็ม | `.neo-price--price .cell-after del` |
| Headline | `.neo-price--top .cell-info` |
| โปร/ประกัน | `.neo-card--info-box .info-items li .link-ti` |
| ซื้อเฉพาะสินค้า | `.neo-card--info-box a[href]:not([href*="/lgsubscribe"])` |

**อย่า** ผูกราคากับตัวเลขคงที่ (649/1299) — ราคาเปลี่ยนได้

### Headless vs curl

| วิธี | ผล |
|------|-----|
| `curl` หน้า TVs | ได้ HTML เปล่า/skeleton — **ไม่มี** class ราคา |
| Playwright headless ธรรมดา | โดน **Access Denied** |
| Playwright headless + stealth | ผ่านได้ **บางครั้ง** — เห็น `neo-price`, ดึงราคาได้ |

Stealth อยู่ใน `server/utils/lgTvImport.ts`: **เปิด `channel: 'chrome'` ก่อนเสมอ** (ไม่ใช่ bundled Chromium ก่อน), UA + `navigator.webdriver=false`, `--disable-blink-features=AutomationControlled`. ตั้ง `LG_SCRAPE_HEADFUL=1` ถ้าต้องการ headed

**สาเหตุที่แก้แล้วกลับมาโดนบ่อย (2026-05):** โค้ดเคย `chromium.launch()` ก่อน แล้วค่อย fallback `channel: 'chrome'` เฉพาะตอน launch พัง — แต่ bundled Chromium **launch ได้** แล้วโดน Access Denied ทุกครั้ง จึงไม่เคย fallback ไป Chrome จริง

### ⚠️ Access Denied (Akamai) กับ headless background — สำคัญ

LG ใช้ **Akamai Bot Manager**. การรัน Playwright แบบ **headless เบื้องหลัง** (ผ่าน Nuxt server / nitro) มีโอกาส **โดน Access Denied สูง และเกิดซ้ำได้บ่อย** เพราะ:

- headless มี fingerprint ต่างจากเบราว์เซอร์จริง (ถึงจะใส่ stealth แล้วก็ตาม)
- รันบนเครื่อง/IP เดียวยิงถี่ → Akamai จับ pattern แล้ว flag IP ชั่วคราว
- ยิง `firstResult=9,18,27,...` ติด ๆ กัน = สัญญาณบอท

**อาการ:** หน้าตอบกลับเป็นเพจ Akamai (`Access Denied` / `Reference #...` / `Pardon Our Interruption`) ไม่มี `li.c-product-list__item.neo-card` → ก่อนหน้านี้แสดงเป็น error "ไม่พบราคา..."

**กลไกรับมือที่ใส่ไว้แล้ว** (`collectTvListCardsWithBrowser`):
1. `detectAccessDenied()` — ตรวจ title/body หาคำของ Akamai
2. `gotoWithAntiBlock()` — retry สูงสุด 4 ครั้ง พร้อม backoff (2s,4s,6s + random)
3. เว้นช่วงสุ่มระหว่างหน้า pagination (~1.2–2.7s)
4. ถ้าได้การ์ดแต่ราคายังไม่ขึ้น → ไม่ throw, เก็บรายการไว้ แล้วเติมราคาจาก PDP ตอน import
5. ถ้าโดน block จริงหลัง retry → error: `LG ปฏิเสธการเข้าถึง (Access Denied) — ลองใหม่อีกครั้งในอีกสักครู่`

**ถ้ายังโดนซ้ำทุกครั้ง — ทางเลือกถัดไป (ยังไม่ทำ):**
- รัน **headful** (`headless: false`) หรือ `headless: 'new'` ของ Chrome — ผ่าน Akamai ได้ดีกว่ามาก แต่ต้องมี display/Xvfb บน server
- ใช้ `playwright-extra` + `puppeteer-extra-plugin-stealth` (ครบกว่าที่เขียนเอง)
- ใช้ **residential/mobile proxy** หมุน IP
- เว้นช่วง scan ให้ห่าง (อย่ายิงรัว) เพื่อให้ IP เย็นลง
- cache ผล scan แล้ว import จาก catalog items (ทำแล้ว — UI ส่ง items กลับมา ไม่ scrape ซ้ำ)

### API ที่ลองแล้ว (ไม่ใช่แหล่งหลักของราคาการ์ด)

- `POST /ncms/asia/api/v1/proxy/retrieveProductList?locale=TH` — ได้ product list แต่ราคา subscribe บนการ์ดไม่ครบใน payload
- Coveo `.../rest/search/v2?organizationId=...` — ยิงตรงจาก server ได้ **401**; ราคาบนการ์ดมาจาก DOM หลัง render มากกว่า

### ผลทดสอบล่าสุด (3 รายการ, ~23–30 วินาที)

ตัวอย่าง batch ที่ราคาถูก: `e2d66730-...`, `7a1f4e0f-...`

| SKU | base_price | full_price |
|-----|------------|------------|
| OLED77C6PSA | 999 | 1999 |
| 55QNED80BSA | 274 | 549 |
| 85QNED80BSA | 674 | 1349 |

เครื่อง user import ~10 วินาที (เร็วกว่า agent sandbox) — ปกติ

---

## ไฟล์ / API สำคัญ

### Import logic
- `server/utils/lgTvImport.ts` — `collectTvListCards`, `collectTvDetailUrls`, `parseTvDetail`
- `server/api/admin/import/tvs-draft.post.ts` — limit **3** รายการ (ปรับได้ที่ `collectTvListCards(3)`)

### Import API
| Method | Path | หน้าที่ |
|--------|------|--------|
| POST | `/api/admin/import/tvs-draft` | สร้าง draft batch + import_products |
| GET | `/api/admin/import/overview` | สถานะ draft ล่าสุด |
| POST | `/api/admin/import/confirm` | promote → `products` |
| DELETE | `/api/admin/import/drafts` | ลบ draft ทั้งหมด |
| GET | `/api/admin/import/items/[itemId]` | รายละเอียด draft 1 ชิ้น |

### สคริปต์ทดสอบ
| Script | ใช้เมื่อ |
|--------|----------|
| `scripts/playwright-open-tvs-test.mjs` | เปิดหน้า TVs (default ไม่ปิดจนกด Enter; `HEADLESS=1` ซ่อนจอ) |
| `scripts/playwright-scan-price-classes.mjs` | สแกน class/ราคา → `tmp/price-class-scan.json` |
| `scripts/debug-tv-list-source.mjs` | จับ network หน้า list |

### Migrations (Supabase)
- `0008_products.sql` … `0016_import_batches.sql`
- รัน migration บน Supabase ก่อนใช้ import

---

## ยังไม่ทำ / คิวถัดไป

- [ ] Import **ทุกรายการ TV** (ไม่จำกัด 3) + benchmark เวลา/RAM
- [ ] ปรับ `tvs-draft.post.ts` รับ `limit` จาก query/body
- [ ] ทดสอบ promote draft → `products` end-to-end บน UI
- [ ] ขยาย import ไป category อื่น (ดู URL ใน `LG_SUBSCRIPTION_SOURCE_URLS.md`)
- [ ] (ถ้าต้องการ) background job แทน synchronous API — Playwright หนัก ~1 นาที/3 รายการ

---

## เอกสารอ้างอิงใน repo

| ไฟล์ | เนื้อหา |
|------|---------|
| `AGENT_IRON_RULES.md` | กฎเหล็ก agent — อ่านก่อนแก้ DB/logic |
| `PROJECT_SPEC.md` | Spec ภาพรวมฟีเจอร์ |
| `INDEX_PAGE_MOCKUP.md` | **หน้าแรก** — อ่านคู่ `public/mockup/index.png` ทุกครั้งที่ทำ front index |
| `PRODUCTS_FIELD_GUIDE.md` | คอลัมน์ products + mapping LG |
| `PRODUCT_IMPORT_REPLACE_WORKFLOW.md` | Flow draft → promote |
| `PRODUCT_DETAIL_EDITOR_FLOW.md` | หน้า editor ราย field |
| `LG_SUBSCRIPTION_SOURCE_URLS.md` | URL หมวด subscription ทุกประเภท |
| `TV_IMPORT_DRYRUN_NOTES.md` | บันทึก dry-run เก่า |
| `DEPLOY.md` | Deploy VPS, env production, Brevo SMTP, PM2 |

---

## Env / รันโปรเจกต์

- Copy `.env.example` → `.env` (Supabase, `NUXT_PUBLIC_SITE_URL`, Line, SMTP)
- โดเมนจริง: `https://lgsubscribe-official.com` — ใช้ใน OG/sitemap/ลิงก์อีเมล PDF
- Node 22+: `nvm use`
- Dev: `npm run dev` → http://localhost:3000
- Admin login ต้องมี user role `admin` หรือ `employee` ใน Supabase Auth metadata
- Deploy production: **[DEPLOY.md](./DEPLOY.md)**

---

## ข้อควรระวัง (สั้นๆ)

1. **อย่า** พึ่ง `curl` สำหรับราคาหน้า list — ต้อง Playwright + รอ render  
2. **อย่า** ใส่ `TV_DETAIL_URL_FALLBACKS` กลับ — ลบแล้ว ใช้หน้าแรกจริง  
3. รัน `nuxt dev` **ตัวเดียว** — หลาย instance กิน RAM  
4. Import error `เปิดหน้าจอไม่ขึ้น` = ไม่เจอราคาใน DOM หลัง 3 retry  
5. `base_price: 0` ใน DB มักมาจาก merge ผิดช่วงก่อนแก้ — ตอนนี้ DOM-first + normalize แล้ว

---

## โครงสร้างโฟลเดอร์ (ย่อ)

```
app/
  pages/admin/          # import, products, users, ...
  pages/auth/           # login, register
  composables/          # useAuth, useAdminProductForm, ...
server/
  api/admin/import/     # tvs-draft, confirm, overview, ...
  utils/lgTvImport.ts   # core scraper
supabase/migrations/    # schema
shared/types/           # product, customer, ...
scripts/                # playwright tests
```

---

*อัปเดตล่าสุด: มิถุนายน 2026 — เพิ่ม PDF ตารางผ่อน + อีเมล Brevo, แก้ site URL canonical*
