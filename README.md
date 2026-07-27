# EnergyRadar

Price comparison for energy drinks. EnergyRadar collects offers from German
supermarkets, stores them along with their price history, and shows where a can
is currently cheapest — including nutrition facts (caffeine, sugar, taurine,
kcal).

> [!IMPORTANT]
> **Research and educational project.** EnergyRadar is a personal learning
> project built to explore monorepo tooling, data modelling and full-stack
> TypeScript. It is not a commercial service and is not intended for production
> or public deployment. The scrapers are meant for occasional, low-volume,
> personal research use only. If you run this yourself, you are responsible for
> respecting each retailer's Terms of Service and `robots.txt`, for keeping
> request rates low, and for not redistributing scraped data. No affiliation
> with, or endorsement by, any retailer or brand mentioned here is implied.

> [!NOTE]
> Early stage. Currently Edeka and Aldi are covered.

## Features

- **Price comparison** across multiple retailers per product
- **Price history** — 30-day timeline and median price per product
- **Deals** — products currently priced below their usual level
- **Search** across brand, product name and can size (`monster 500ml`)
- **Nutrition facts** parsed directly from the retailers' product pages

## Tech Stack

| Area     | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Monorepo | Turborepo, pnpm workspaces                                        |
| Frontend | React 19, Vite, TanStack Router & Query, Tailwind CSS v4, Recharts |
| Backend  | Express 5, Pino                                                   |
| Database | PostgreSQL, Prisma 7                                              |
| Scraper  | Cheerio, tsx                                                      |
| Language | TypeScript (everywhere)                                           |

## Project Structure

```
apps/
  web/        React SPA — frontend
  api/        Express REST API + seed data
  scraper/    Retailer scrapers (Edeka, Aldi) → write to the DB
packages/
  db/         Prisma schema, migrations, generated client
  shared/     Shared TypeScript types
  eslint-config/ , typescript-config/    Shared configs
```

## Setup

**Requirements:** Node ≥ 18, pnpm 9, a running PostgreSQL instance.

```bash
# 1. Clone the repo and install dependencies
git clone https://github.com/Factorium1/EnergyRadar.git
cd EnergyRadar
pnpm install

# 2. Create the environment files
cp .env.example .env                   # DATABASE_URL (shared by all workspaces)
cp apps/api/.env.example apps/api/.env # API port

# 3. Run migrations and generate the Prisma client
pnpm --filter @energyradar/db migrate:dev
pnpm --filter @energyradar/db generate

# 4. Seed the base data (brands, sellers)
pnpm --filter @energyradar/api seed

# 5. Start everything
pnpm dev
```

The frontend then runs on `http://localhost:5173`, the API on the `PORT` set in
`apps/api/.env` (falls back to `8080`).

### Environment Variables

Shared variables live in the root `.env` so they can't drift apart between
workspaces. App-specific values stay in each workspace's own `.env`.

| Variable       | Location        | Description                  |
| -------------- | --------------- | ---------------------------- |
| `DATABASE_URL` | root `.env`     | PostgreSQL connection string |
| `PORT`         | `apps/api/.env` | Port the API listens on      |

## Running the Scraper

The scraper fetches current offers and upserts brands, products, sellers and
offers into the database:

```bash
pnpm --filter @energyradar/scraper dev
```

Please run this sparingly — see the note at the top of this README.

## API

Base URL: `/api/v1`

| Method | Endpoint                 | Description                                            |
| ------ | ------------------------ | ------------------------------------------------------ |
| `GET`  | `/deals`                 | Products sorted by cheapest price, with price change    |
| `GET`  | `/brands`                | All brands                                             |
| `GET`  | `/brands/:brandSlug`     | A single brand including its products                  |
| `GET`  | `/products/:productSlug` | Product details, offers per seller, price timeline      |
| `GET`  | `/search?q=`             | Search across product name, product line and volume     |

## Scripts

All root scripts run through Turborepo and cover the whole monorepo:

| Script             | Description                        |
| ------------------ | ---------------------------------- |
| `pnpm dev`         | All apps in watch mode             |
| `pnpm build`       | Build everything                   |
| `pnpm lint`        | ESLint                             |
| `pnpm check-types` | TypeScript type checking           |
| `pnpm format`      | Prettier across all `.ts/.tsx/.md` |

Individual workspaces can be targeted with
`pnpm --filter @energyradar/<name> <script>`.
