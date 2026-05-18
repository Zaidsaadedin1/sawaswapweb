# SawaSwap Website

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL`.
3. Set `VITE_SUPABASE_ANON_KEY`.
4. Run `npm install`.
5. Run `npm run dev`.

## Supabase auth redirect setup

This website now handles both email verification and password recovery on:

- `https://www.sawaswap.com/auth/verified`
- `http://localhost:5173/auth/verified`

Add both URLs to Supabase:

1. Supabase Dashboard -> Authentication -> URL Configuration.
2. Add the two URLs above under Redirect URLs.
3. Keep using `/auth/verified` as the `redirectTo` value when sending password reset emails from the app.

When Supabase sends a recovery link with `type=recovery`, the page shows the reset-password form. For normal verification links, it still shows the verified screen.

## Admin dashboard

This website now includes:

- `/admin/login` for admin sign-in
- `/admin/dashboard` for admin CRUD management

Admin access is gated by `profiles.is_admin = true`.

Before using the admin dashboard, run the SQL migration in:

- `supabase/migrations/20260518120000_admin_controls.sql`

That migration adds:

- `profiles.is_admin`
- `trade_offers.admin_review_status`
- `trade_offers.admin_reviewed_at`
- `trade_offers.admin_review_notes`

Use `trade_offers.admin_review_status = 'approved'` for offers that should be public. Admins can also set the value to `cancelled`.
