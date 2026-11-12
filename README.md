# LOVE6 — Next.js + Supabase

## Requirements
- Node.js 20.9+ (Node 22 LTS recommended)
- A Supabase project

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set these variables in `.env.local` and in the production hosting environment:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable/anon key (never use a service-role key in a `NEXT_PUBLIC_` variable).
- `NEXT_PUBLIC_SITE_URL`: site origin used for auth redirects, e.g. `http://localhost:3000` locally and your deployed HTTPS URL in production.

## Supabase setup

Run the SQL files in Supabase SQL Editor in this order, reviewing each file first:

1. `supabase/schema.sql` — base tables, profile/admin policies, and demo seed.
2. `supabase/task-fixes.sql` — compatibility updates used by current video management.
3. `supabase/magazine.sql` — magazine table and admin-only storage policies for covers.

The Magazine feature reuses the existing public Storage bucket named `thumbnails`; covers are stored in its `magazine/` folder. The upload UI accepts JPG, PNG, and WebP from 10 KB through 500 KB, matching the video-thumbnail limit. Ensure the existing `thumbnails` bucket is public for public cover display and its file-size limit is at least 500 KB.

For OAuth, enable the provider in Supabase Authentication settings and add the local callback (`http://localhost:3000/auth/callback`) and production callback (`https://YOUR_DOMAIN/auth/callback`) to the allowed redirect URLs. Keep the Supabase Site URL and redirect allowlist aligned with your deployed domain.

Admin access is controlled by `public.admin_users`, linked to the Supabase Auth user ID. Add only trusted users and keep `is_active = true` for active admins. Never expose service-role credentials in client code.

## Commands

```bash
npm run dev       # local development
npm run lint      # TypeScript validation
npm run build     # production build
npm start         # serve production build
```

## Included features

- Responsive LOVE6 homepage, search, categories, trending, and video detail/player.
- Supabase email/Google auth, user dashboard, and per-user video favorites.
- Protected admin dashboard and video management.
- Magazine listing with 4:5 cover cards opening KaryaKarsa in a new tab.
- Admin Magazine manager to add covers/titles/URLs and remove magazine entries.
- Supabase Row Level Security policies and view-count RPC.
