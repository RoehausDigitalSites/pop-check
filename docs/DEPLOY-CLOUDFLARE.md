# Deploy Pop Check on Cloudflare Pages

Cloudflare Pages does **not** run a normal Node server. Next.js on Cloudflare uses the **OpenNext Cloudflare** adapter so your app runs on **Workers**. Follow the official guide and keep this checklist handy.

**Official guide:** [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

---

## 0. Edge runtime (this repo)

All app routes and API handlers use `export const runtime = "edge"` so **Cloudflare Pages** / `@cloudflare/next-on-pages` can bundle them. Prisma talks to Postgres via **`@prisma/adapter-neon`** and **`@neondatabase/serverless`** (a normal `postgresql://…` Neon URL — not `prisma://`). SMS uses Twilio’s **REST API via `fetch`**. In production on Workers, point **`DATABASE_URL`** at Neon (often via **Hyperdrive**).

## 1. Prerequisites

- Code in **Git** (GitHub, GitLab, or Bitbucket).
- A **Postgres** database reachable from the internet (e.g. [Neon](https://neon.tech), Supabase, Railway). You will connect it with **[Hyperdrive](https://developers.cloudflare.com/hyperdrive/)** (recommended) or a compatible serverless driver.
- This repo uses **Prisma**, **API routes**, **Twilio**, and **cron**. You must align Prisma with the Workers runtime (see [Prisma on Cloudflare](https://www.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-cloudflare) and Hyperdrive docs) before production traffic.

---

## 2. Create the Pages project

1. **Cloudflare Dashboard** → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select the repo and branch (e.g. `main`).
3. **Framework preset:** Next.js (or “OpenNext” if shown).
4. **Build command** and **output directory** must match what the OpenNext Cloudflare guide specifies for your Next.js version (often something like building with `opennextjs-cloudflare` and deploying the generated Worker bundle — **do not** use plain `next build` + `next start` on Pages).

If the dashboard offers **“Deploy with Cloudflare’s Next.js template”**, use it and merge the generated `wrangler` / OpenNext setup into this repo.

---

## 3. Environment variables (Pages)

In **Pages** → your project → **Settings** → **Environment variables**, add (names match `.env.example`):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Often provided by **Hyperdrive** (see below), not a raw public string in Workers if you use Hyperdrive binding |
| `APP_BASE_URL` | `https://isles.life` (or your canonical URL) |
| `ADMIN_PASSPHRASE` | Strong secret |
| `CRON_SECRET` | Strong random string (for `/api/cron/send-daily`) |
| `TWILIO_ACCOUNT_SID` | Optional if using real SMS |
| `TWILIO_AUTH_TOKEN` | |
| `TWILIO_FROM_NUMBER` | |

Use **Production** (and **Preview** if you want staging) scopes.

---

## 4. Postgres + Hyperdrive (recommended)

1. Create Postgres (Neon is a common choice).
2. **Hyperdrive** → create a configuration pointing at your DB.
3. Bind Hyperdrive to your Worker per Cloudflare’s docs and wire Prisma to use that connection in production.

This gives connection pooling and a stable story for Prisma on Workers.

---

## 5. Run migrations (from your machine or CI)

Migrations are not run by Pages on each deploy unless you automate it. Typical approach:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Use a URL that can reach the **same** DB your production app uses (often the direct Neon connection string for admin tasks).

---

## 6. Cron (replaces `vercel.json`)

`vercel.json` in this repo is **ignored by Cloudflare**. Schedule the job with one of:

- **Workers Cron Triggers** (in `wrangler.toml` or the dashboard) calling your deployed URL, **or**
- An external cron (e.g. Uptime Robot, cron-job.org) `GET` to:

  `https://isles.life/api/cron/send-daily`

  with header:

  `Authorization: Bearer <CRON_SECRET>`

  (Your route also accepts `x-cron-secret` for manual tests.)

Pick a sensible schedule (e.g. daily at your dad’s reminder time), not necessarily every 5 minutes unless you need it for testing.

---

## 7. Domain `isles.life` (same Cloudflare account)

1. **Pages** → project → **Custom domains** → **Set up a domain** → add `isles.life` and/or `www.isles.life`.
2. Cloudflare will add/update **DNS** for you when the zone is on Cloudflare.
3. Choose **one canonical host** (apex or `www`) and redirect the other in **Custom domains** / **Bulk redirects**.
4. **SSL/TLS** → **Full (strict)** is typical when origin is Cloudflare Pages.

Because DNS and Pages live in one place, you usually **do not** need the extra “Vercel + Cloudflare DNS” juggling.

---

## 8. Twilio

- Ensure **Messaging** numbers and any webhooks use your **production** `APP_BASE_URL` if you add inbound webhooks later.
- Outbound-only SMS works once env vars are set on Pages.

---

## 9. After deploy

- Open `https://isles.life` and `/admin`.
- Trigger cron manually once with `curl` + `Authorization: Bearer …` to verify SMS path.
- Complete a test check-in end-to-end.

---

## If you get stuck

- **Prisma / DB in Workers:** Hyperdrive + Prisma docs (links above).
- **Build fails on Pages:** Compare your repo to the latest **OpenNext + Cloudflare** example for your Next.js major version.
- **Simpler alternative:** Deploy the same repo to **Vercel** or a **Node** host with `next start` and keep using `vercel.json` cron — no Workers adapter required.

### Worker size limit (free plan ~3 MiB)

Cloudflare’s **free** Workers bundle is capped around **3 MiB**. If deploy fails with *“Worker exceeded the size limit”*:

1. **This repo avoids the common pitfall:** do **not** import from the umbrella `radix-ui` package — its main file pulls in **every** Radix component. Use scoped packages (`@radix-ui/react-slot`, `@radix-ui/react-slider`, …) only.
2. Prefer **named imports** from `recharts` instead of `import * as recharts`.
3. **Paid Workers** raise the limit (e.g. **10 MiB** on paid plans — see Cloudflare’s pricing/docs).

If you still exceed the limit after trimming dependencies, use a **paid Workers plan** or deploy to a **Node** host (Vercel, Railway, etc.) where this cap does not apply.
