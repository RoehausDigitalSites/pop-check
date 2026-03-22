## Pop Check

A simple SMS-based daily check-in app for family (built with Next.js + Postgres + Prisma).

### What it does

- Sends daily SMS check-in links.
- Lets participant submit scale-based answers quickly.
- Supports manual anytime check-ins via persistent manual URL.
- Stores all responses for later charting.
- Includes an admin dashboard for questions and schedule.

### Tech stack

- Next.js App Router
- Prisma + Postgres
- Twilio SMS
- Scheduled reminders via `/api/cron/send-daily` (see deployment docs)

### Setup

1. Copy env file and fill values:

   `cp .env.example .env`

2. Install dependencies:

   `npm install`

3. Run database migration:

   `npm run db:migrate -- --name init`

4. Seed starter participant + questionnaire:

   `npm run db:seed`

5. Start dev server:

   `npm run dev`

Open `http://localhost:3000` and then `http://localhost:3000/admin`.

### Twilio behavior

- If Twilio env variables are not set, SMS sends are logged to server output as `[mock-sms]`.
- Once configured, real SMS sends are made via Twilio.

### Cron endpoint

- Endpoint: `GET /api/cron/send-daily`
- Auth: `Authorization: Bearer <CRON_SECRET>` (or `x-cron-secret` for manual testing)
- **Vercel:** `vercel.json` can schedule this route (if you deploy there).
- **Cloudflare Pages:** `vercel.json` is not used — schedule with Workers Cron or an external cron hitting the URL. See **[docs/DEPLOY-CLOUDFLARE.md](./docs/DEPLOY-CLOUDFLARE.md)**.

### Deploy (Cloudflare Pages + isles.life)

Step-by-step guide: **[docs/DEPLOY-CLOUDFLARE.md](./docs/DEPLOY-CLOUDFLARE.md)** (OpenNext adapter, Hyperdrive, env vars, domain in Cloudflare, cron).

Official reference: [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/).
