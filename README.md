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
