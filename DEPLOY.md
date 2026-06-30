# LG Subscribe — คู่มือ Deploy

เอกสารอ้างอิงเมื่อ deploy / อัปเดต production (VPS + Supabase)

---

## ภาพรวม

| ส่วน | ที่รัน |
|------|--------|
| Database, Auth, Storage | **Supabase** (แนะนำแยกโปรเจกต์ dev / prod) |
| เว็บ + API (Nuxt 4 SSR) | **VPS** + Node 22 + PM2 + Nginx |
| Line Webhook | `https://<โดเมน>/api/line/webhook` |

**ทำไม VPS:** Admin + Import จาก LG.com ใช้ **Playwright + Chrome** — serverless (Vercel ฟรี) มักรัน import ไม่ได้

---

## ความต้องการ

- Node.js **22+** (`nvm use` / `.nvmrc`)
- npm **10+**
- Git, Nginx (reverse proxy), SSL (เช่น Certbot)
- Supabase โปรเจกต์ production

---

## 1) เตรียมก่อน deploy

### บนเครื่อง dev

```bash
nvm use
npm ci
npm run build
npm run preview   # ทดสอบ http://localhost:3000
```

### Push โค้ด

```bash
git add .
git commit -m "..."
git push origin main
```

ตรวจว่า commit มี **`package.json`** และ **`package-lock.json`** ครบ (มี dependency เช่น `qrcode`)

---

## 2) Supabase (Database)

### โปรเจกต์ใหม่ (ยังไม่มี schema)

1. [Supabase Dashboard](https://supabase.com/dashboard) → สร้างโปรเจกต์
2. **SQL Editor** → วางรัน `supabase/ALL_MIGRATIONS.sql`
3. รัน migration เพิ่มที่อาจยังไม่อยู่ในไฟล์รวม (เช็คเลขล่าสุดใน `supabase/migrations/`):

   ```text
   0036_customer_experiences.sql
   0037_customer_experience_image_urls.sql
   0038_product_subscribe_value.sql
   … (ไฟล์ใหม่กว่า ALL_MIGRATIONS)
   ```

   สร้างไฟล์รวมใหม่ (ถ้าต้องการ):

   ```bash
   node scripts/build-all-migrations.mjs
   ```

### Production มี schema แล้ว

รันเฉพาะไฟล์ใน `supabase/migrations/` ที่ **ยังไม่เคยรัน** ตามลำดับเลข  
**อย่า** รัน `ALL_MIGRATIONS.sql` ซ้ำทั้งไฟล์ — จะ error duplicate

### หลัง migrate

- **Authentication → URL Configuration**
  - Site URL: `https://<โดเมน>`
  - Redirect URLs: `https://<โดเมน>/**`
- Storage buckets (จาก migration): `category-icons`, `product-images`
- สร้าง user staff ใน Auth → `user_metadata.role` = `admin` หรือ `employee`

---

## 3) Environment (production)

คัดลอก `.env.example` → `.env` บน VPS (หรือ secrets ของ host)

```env
# บังคับ
NUXT_PUBLIC_SITE_URL=https://lgsubscribe-official.com
NUXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=...
NUXT_SUPABASE_SERVICE_ROLE_KEY=...   # server only — ห้าม commit / ห้าม expose client

# Line (ถ้าใช้แจ้งเตือนคำขอสมัคร)
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
LINE_NOTIFY_USER_IDS=Uxxxx,Uyyyy
NUXT_PUBLIC_LINE_OA_ID=...
# NUXT_PUBLIC_LINE_OA_URL=https://line.me/R/ti/p/@your-line-id
# NUXT_PUBLIC_LINE_OA_QR_IMAGE=/images/line_official_qr.webp

# Import LG บน VPS (ถ้าใช้ /admin/import)
# Xvfb :99 -screen 0 1366x900x24 &
# DISPLAY=:99
# LG_SCRAPE_HEADFUL=1
# LG_CHROME_PATH=/usr/bin/google-chrome-stable

# ส่ง PDF ตารางผ่อน (Brevo SMTP) — ต้องครบทุกค่า + whitelist IP VPS ใน Brevo
NUXT_SMTP_HOST=smtp-relay.brevo.com
NUXT_SMTP_PORT=587
NUXT_SMTP_USER=b062e6001@smtp-brevo.com
NUXT_SMTP_PASS=...
NUXT_SMTP_FROM=LG Subscribe <omyimplusoat@gmail.com>
```

ใช้ **Supabase production** แยกจาก dev — อย่าใส่ key dev บน server จริง

---

## 4) Deploy ครั้งแรก (VPS)

### ติดตั้งพื้นฐาน (Ubuntu ตัวอย่าง)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs git nginx

# (ถ้าใช้ import LG) Chrome + Xvfb
# sudo apt install -y google-chrome-stable xvfb
# npx playwright install chromium && npx playwright install-deps
```

### โคลนและ build

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/<org>/lgsubscribe-official.git
cd lgsubscribe-official

cp .env.example .env
nano .env   # ใส่ค่า production

npm ci
npm run build
```

### รันด้วย PM2

```bash
npm i -g pm2
pm2 start .output/server/index.mjs --name lgsubscribe
pm2 save
pm2 startup   # ทำตามคำสั่งที่ PM2 แสดง
```

### Nginx (reverse proxy → พอร์ต 3000)

```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # import นำเข้าสินค้า (เปิด PDP หลายรายการ) อาจใช้เวลานาน
    proxy_read_timeout 900s;
    proxy_connect_timeout 60s;
    proxy_send_timeout 900s;
  }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

**504 ตอนดึงรายการ LG:** deploy โค้ดที่ใช้ `POST /api/admin/import/catalog/scan` + poll (ไม่รอ scrape ใน GET เดียว) และตั้ง `proxy_read_timeout` ตามด้านบน — ขั้นตอน **นำเข้าดราฟ** ยังใช้ request ยาว ต้อง timeout 900s เช่นกัน

---

## 5) อัปเดตครั้งถัดไป

```bash
cd /var/www/lgsubscribe-official
git pull
npm ci              # สำคัญ — ติดตั้ง dependency ตาม lockfile
npm run build
pm2 restart lgsubscribe
```

ถ้ามี migration ใหม่ → รันบน Supabase SQL Editor ก่อนหรือหลัง deploy ตามความเสี่ยงของฟีเจอร์

---

## 6) Line Webhook

1. [Line Developers](https://developers.line.biz/) → Messaging API
2. Webhook URL: `https://<โดเมน>/api/line/webhook`
3. เปิด **Use webhook**
4. `LINE_CHANNEL_SECRET` ต้องตรง Channel secret
5. ทดสอบจาก Admin → Line OA (ถ้ามีเมนู)

---

## 7) เช็คหลัง deploy

- [ ] `https://<โดเมน>/` โหลดได้
- [ ] `/products` — มือถือกด「กรองและเรียง」เปิด drawer มีหมวด + เรียง
- [ ] `/auth/login`, `/admin` — login staff ได้
- [ ] อัปโหลดรูปใน admin ได้
- [ ] ส่งคำขอสมัคร / Line แจ้งเตือน (ถ้าเปิด Line)
- [ ] `/admin/import` — import LG (เฉพาะ VPS ที่ติด Chrome + Playwright)

---

## แก้ปัญหา build บ่อย

### `Rollup failed to resolve import "qrcode"`

- สาเหตุ: บน VPS ยังไม่มีแพ็กเกจ `qrcode` ใน `node_modules` (ยังไม่ `npm ci` หรือ lockfile เก่า)
- แก้:

  ```bash
  git pull
  npm ci
  ls node_modules/qrcode/package.json   # ต้องมีไฟล์นี้
  npm run build
  ```

- โค้ดใช้ `useLineOaQr.client.ts` (client-only) เพื่อไม่ให้ SSR bundle พยายาม resolve `qrcode` ตอน build

### Build ผ่านแต่รันแล้ว 500

- เช็ค `.env` บน VPS ครบ `NUXT_PUBLIC_SUPABASE_*` และ service role
- `pm2 logs lgsubscribe`

### Import LG Access Denied

- ดู `PROJECT_HANDOFF.md` — Akamai / Playwright headful / `LG_SCRAPE_HEADFUL=1`

---

## ทางเลือก host อื่น

| Host | หมายเหตุ |
|------|----------|
| **VPS + PM2 + Nginx** | แนะนำ — ครบทุกฟีเจอร์รวม import |
| Railway / Render | ตั้ง env เหมือน VPS, start: `node .output/server/index.mjs` |
| Vercel | เหมาะหน้าร้าน; import Playwright ต้องแยก worker/VPS |

---

## เอกสารที่เกี่ยวข้อง

| ไฟล์ | เนื้อหา |
|------|---------|
| `README.md` | Setup dev, env พื้นฐาน |
| `.env.example` | รายการตัวแปร env ทั้งหมด |
| `PROJECT_HANDOFF.md` | ภาพรวมโปรเจกต์ + import LG |
| `supabase/migrations/` | Migration รายไฟล์ |
| `supabase/ALL_MIGRATIONS.sql` | รวม migration สำหรับ DB ใหม่ |

---

*อัปเดต: มิถุนายน 2026*
