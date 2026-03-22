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
- Vercel Cron

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
- Vercel cron schedule configured in `vercel.json` to run every 5 minutes.
