# SolarForge

SolarForge is a planning app for grid-tied, hybrid, off-grid, cabin, and van solar systems. The same TypeScript calculation engine runs on the web and in the Expo app.

Estimates are preliminary. They are not an engineering stamp, a permit set, or a substitute for the electrical code adopted where you build.

## What works locally

- Landing page, public calculators, and a project wizard
- NOAA solar position, with azimuth measured clockwise from true north
- Northern and southern orientation guidance
- Array sizing, battery sizing, string-voltage checks, shading geometry, and payback bands
- Projects saved in the browser, with a one-project limit on the free plan
- Dashboard and a text PDF report
- Roof layout using dimensions you type in
- Sample equipment catalog, marked unverified
- Account API when PostgreSQL and `AUTH_SECRET` are set
- Optional NREL PVWatts, OpenAI, and Stripe when their environment variables are set

## What is not finished

- App Store and Play billing. RevenueCat is not wired; mobile purchases stay disabled without `EXPO_PUBLIC_REVENUECAT_API_KEY`.
- Team seats on the Professional plan
- LiDAR or automatic roof measurement
- Hourly weather files, inverter clipping, and code-compliant conductor sizing
- A hosted production deploy. Docker and the GitHub Action build the web app; they do not provision a cloud account.

## Run the web app

Requires Node.js 20 or newer.

```bash
npm install
npm test
npm run dev
```

Open http://localhost:3000.

Copy `.env.example` to `apps/web/.env` before using accounts, NREL, OpenAI, or Stripe. Public calculators and browser projects do not need those keys.

## Database

```bash
docker compose up -d
```

Set `DATABASE_URL` and `AUTH_SECRET`, then from `apps/web`:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Seed creates an admin only when `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set. There is no default password.

## Mobile

```bash
npm run dev:mobile
```

The Expo app imports `@solarforge/engine` and `@solarforge/shared`. iOS and Android builds use EAS; `apps/mobile/eas.json` is the profile stub. Store billing is not enabled.

## Calculations

| Module | Model |
| --- | --- |
| Solar position | NOAA / Meeus, azimuth clockwise from true north |
| Irradiation | Duffie monthly extraterrestrial, Erbs diffuse fraction, isotropic transposition |
| Production | PVWatts-style temperature and loss stack |
| Battery | AC load ÷ inverter efficiency ÷ (DoD × discharge efficiency × temperature) |
| Strings | Cold Voc and hot Vmp against inverter limits |
| Money | Import rate for on-site energy, export rate defaulting to zero |

Without `NREL_API_KEY` or a 12-month irradiation file, horizontal resource is an approximate clearness curve. The interface says so.

## Deployment

The Dockerfile builds the Next.js app. Set secrets in the host environment, not in `NEXT_PUBLIC_` variables except the site URL, contact email, and Stripe publishable key. `npm run build` runs Prisma generate and the Next production build. Pushing to GitHub runs tests, typecheck, and that build.
