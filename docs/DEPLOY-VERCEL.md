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

**Hobby plan:** Vercel only allows **at most one run per day** per cron (no `*/5`, hourly, etc.). This repo defaults to **`0 2 * * *`** (02:00 UTC daily) — often a good match for an **evening** reminder in US time zones; change the hour/minute in `vercel.json` if your participant’s `dailyTimeLocal` + timezone needs a different UTC time.

The handler sends when **local time is on or after** the participant’s **Daily time** in admin **and** we haven’t already sent a scheduled SMS **that local calendar day**. The **first** cron run after the reminder time (in that timezone) will send — so the cron’s UTC time should fall **after** that moment when converted to the participant’s zone (e.g. use a [time zone converter](https://www.timeanddate.com/worldclock/converter.html) from `dailyTimeLocal` + timezone to UTC, then set `0 <hour> * * *`).

**More reliable timing:** use a free external cron (e.g. cron-job.org) to `GET /api/cron/send-daily` with your `Authorization: Bearer` header every 5–15 minutes, or upgrade to **Pro** for flexible Vercel crons.

After deploy, check **Project → Cron Jobs** that the schedule is listed.

## 5. Custom domain

**Project** → **Settings** → **Domains** → add your domain. Set `APP_BASE_URL` to the canonical HTTPS URL.

## 6. Web Analytics

The app includes `@vercel/analytics` in the root layout. In the Vercel dashboard, open **Analytics** for the project and enable **Web Analytics** if prompted so page views show up.

## 7. Smoke test

- Open `/` and `/admin`.
- Trigger cron manually:

  `curl -H "Authorization: Bearer YOUR_CRON_SECRET" "https://YOUR_APP/api/cron/send-daily"`

- Complete one check-in end-to-end.
