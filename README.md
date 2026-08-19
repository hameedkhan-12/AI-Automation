This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1) Start the local database

This project uses PostgreSQL in Docker for local development:

```bash
docker compose up -d db
```

The default local database connection is:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/flux"
```

### 2) Configure environment variables

Copy the example file and update any values you need:

```bash
cp .env.example .env
```

The app validates the required environment values at startup, so missing or invalid values will fail early with a clear error.

### 3) Run the app

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 4) Reset the local database

```bash
npm run db:reset
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://nextjs.org/docs/app/building-your-application/optimizing/fonts), a new font family for Vercel.

## Trading Vertical Architecture & Engine

Flux includes a quantitative paper trading vertical built on top of the workflow graph execution engine.

### Core Components
- **`ExchangeAdapter` abstraction**: Unified interface (`src/features/trading/adapters/types.ts`) implemented by `alpaca.ts`. Adding an exchange requires only a new adapter file and a one-line entry in `registry.ts`.
- **`MarketDataProvider` parity**: Live and backtest modes emit identical `Candle` shapes downstream so indicator and order logic behaves consistently across live execution and historical replay.
- **3 Workflow Nodes**:
  - `Market Data`: Triggers executions on live tick updates or starts backtesting workflows.
  - `Indicator`: Calculates SMA, EMA, RSI, and MACD via `technicalindicators`.
  - `Order`: Places paper orders via Alpaca paper trading API with deterministic idempotency keys (`client_order_id: ${executionId}-${nodeId}`).

### Engineering Tradeoffs & Architecture Notes
1. **Indicator State Hot-path & Eventual Consistency**:
   - **Hot Path**: Rolling indicator price buffers reside in Upstash Redis (`indicator:{nodeId}:prices`).
   - **Cold Path**: Postgres `IndicatorState` table is synced every 100 ticks for auditing.
   - *Accepted Tradeoff*: Prioritizes sub-millisecond tick execution throughput; up to 100 ticks of indicator buffer may need rebuilding upon process restart.
2. **Production Deployment for `market-listener`**:
   - The standalone `services/market-listener/index.ts` process maintains a persistent WebSocket connection to Alpaca.
   - *Deployment Requirement*: While Next.js API routes and the UI deploy serverless (e.g. on Vercel), `services/market-listener` requires an always-on persistent container/host (Railway, Fly.io, or VPS).

### Seeding the Demo Strategy
To seed a pre-configured AAPL 10/30 SMA crossover trading workflow with connections:
```bash
npx tsx scripts/seed-sma-crossover.ts
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

