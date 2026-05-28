# LG Subscribe Official

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

Create `.env` in project root:

```env
NUXT_PUBLIC_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_SUPABASE_SERVICE_ROLE_KEY=
```

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

Run migrations in Supabase SQL editor in order from:

- `supabase/migrations/0001_categories.sql`
- ...
- `supabase/migrations/0011_customer_profiles.sql`

Important latest migrations:

- `0010_product_card_notes.sql` (product card note fields)
- `0011_customer_profiles.sql` (customer profile/contact data)

## Build / Preview

```bash
npm run build
npm run preview
```
