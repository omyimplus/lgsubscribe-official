# LG Subscribe

Nuxt 4 + Supabase project for LG Subscribe website and backend office.

## Requirements

- Node.js `22+` (recommended: use `nvm`)
- npm `10+`

Use project Node version:

```bash
nvm install 22
nvm use
```

## Environment Variables

Copy `.env.example` → `.env` in project root. รายการครบอยู่ใน `.env.example` และ **[DEPLOY.md](./DEPLOY.md)** (production)

ขั้นต่ำสำหรับ dev:

```env
NUXT_PUBLIC_SITE_URL=https://lgsubscribe-official.com
NUXT_PUBLIC_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_SUPABASE_SERVICE_ROLE_KEY=
```

ส่ง PDF ตารางผ่อนทางอีเมล (ลูกค้าในตะกร้า) — ตั้ง **Brevo SMTP** ใน `.env`:

```env
NUXT_SMTP_HOST=smtp-relay.brevo.com
NUXT_SMTP_PORT=587
NUXT_SMTP_USER=xxxx@smtp-brevo.com
NUXT_SMTP_PASS=xsmtpsib-...
NUXT_SMTP_FROM=LG Subscribe <verified-sender@example.com>
```

Brevo: whitelist IP เครื่อง dev / VPS ใน **Authorized IPs** · sender ต้อง verify ในแท็บ Senders

## Setup

```bash
npm install
```

## Run Development

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Database Migrations (Supabase)

รัน migration ตามลำดับเลขใน `supabase/migrations/` (บน Supabase SQL Editor)

ล่าสุดที่เกี่ยวกับฟีเจอร์ PDF อีเมล:

- `0054_cart_installment_schedule_pdf_requests.sql` (หรือเวอร์ชันที่สร้าง `cart_pdf_email_leads`)
- `0055_migrate_cart_pdf_email_leads.sql` — ย้ายข้อมูลจากตารางเก่า (ถ้ามี)

DB ใหม่: ใช้ `supabase/ALL_MIGRATIONS.sql` หรือ `node scripts/build-all-migrations.mjs` แล้วรันไฟล์รวม

## Build / Preview

```bash
npm run build
npm run preview
```

## Deploy (Production)

ดูคู่มือเต็มใน **[DEPLOY.md](./DEPLOY.md)** — Supabase migrations, env, VPS + PM2 + Nginx, อัปเดตครั้งถัดไป
