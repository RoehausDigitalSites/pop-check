# Deploy Pop Check on Vercel

This app targets **Vercel** (Node.js runtime) + **Neon** Postgres + optional Twilio SMS.

## 1. Repo & project

1. Push this repo to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import the repo.
3. **Framework:** Next.js (auto-detected). **Build:** `npm run build` (default). **Output:** Next default.

## 2. Environment variables

In **Project** → **Settings** → **Environment Variables**, add the same names as your local `.env` / `.env.example`, for **Production** (and **Preview** if you want):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon connection string (or any Postgres Vercel can reach) |
| `APP_BASE_URL` | `https://your-domain.vercel.app` or your custom domain |
| `ADMIN_PASSPHRASE` | Admin login secret |
| `CRON_SECRET` | Random string; Vercel cron will send `Authorization: Bearer …` |
| `TWILIO_*` | Optional; if unset, SMS is mocked in logs |

Redeploy after changing env vars.

## 3. Database migrations

Run once against your **production** database (from your machine or CI):

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

## 4. Cron (`vercel.json`)

This repo includes a **Vercel Cron** entry for `GET /api/cron/send-daily`. After deploy, confirm in the Vercel dashboard **Cron Jobs** tab that the schedule looks right.

The example schedule may be frequent for testing — adjust `vercel.json` to a daily cron when you’re ready (e.g. once per day in UTC that matches your participant’s timezone logic in the route).

## 5. Custom domain

**Project** → **Settings** → **Domains** → add your domain. Set `APP_BASE_URL` to the canonical HTTPS URL.

## 6. Web Analytics

The app includes `@vercel/analytics` in the root layout. In the Vercel dashboard, open **Analytics** for the project and enable **Web Analytics** if prompted so page views show up.

## 7. Smoke test

- Open `/` and `/admin`.
- Trigger cron manually:

  `curl -H "Authorization: Bearer YOUR_CRON_SECRET" "https://YOUR_APP/api/cron/send-daily"`

- Complete one check-in end-to-end.
