# Flux

### Visual Workflow Automation & Quantitative Trading Platform

Flux is a full-stack workflow automation platform that lets users build, execute, and monitor workflows through a visual node-based editor.

The platform combines a graph-based workflow execution engine with AI integrations, external service triggers, realtime execution monitoring, and a quantitative paper-trading vertical built on the same execution infrastructure.

---

## 🚀 Overview

Flux allows users to visually compose workflows such as:

```text
Manual Trigger
      ↓
HTTP Request
      ↓
OpenAI
      ↓
Slack
```

and quantitative trading strategies such as:

```text
Market Data
      ↓
SMA (10)
      ↓
SMA (30)
      ↓
Trading Decision
      ↓
Order
```

Workflows are represented as directed graphs and executed asynchronously through Inngest. Each node operates on a shared execution context, allowing outputs from one node to be consumed dynamically by downstream nodes.

The trading vertical reuses the same workflow engine to support both historical backtesting and live paper-trading workflows.

---

## ✨ Features

### Visual Workflow Builder

* Node-based workflow editor powered by React Flow
* Drag-and-drop workflow composition
* Directed node connections
* Topological workflow execution
* Shared runtime context between nodes
* Realtime node execution status
* Execution history and inspection

### Automation Nodes

* Manual Trigger
* HTTP Request
* Google Form Trigger
* Stripe Trigger
* OpenAI
* Anthropic
* Google Gemini
* Slack
* Discord

### AI Integrations

* OpenAI
* Anthropic
* Google Gemini
* Dynamic prompts using workflow context
* Encrypted API credentials
* Provider-specific credential management

### Quantitative Trading

* Alpaca paper trading
* Realtime market data through WebSockets
* Historical market data
* SMA
* EMA
* RSI
* MACD
* Market Data workflow node
* Indicator workflow node
* Order workflow node
* Paper positions
* Paper order history
* Idempotent order execution

### Backtesting

* Historical candle replay
* Strategy execution using the same workflow engine
* Equity curve generation
* Total return
* Maximum drawdown
* Win-rate and trade statistics
* Historical candle caching

### Infrastructure

* PostgreSQL persistence
* Redis-backed hot indicator state
* Inngest background workflow execution
* Persistent market-data listener
* Encrypted credentials
* Sentry error monitoring
* SaaS authentication and subscriptions

---

# 🏗️ Architecture

Flux is designed around a reusable workflow execution engine.

The frontend represents workflows as graphs, while the backend converts those graphs into executable node pipelines.

### Architecture Diagram

> **[ ARCHITECTURE DIAGRAM — PLACE IMAGE HERE ]**
>
> Suggested file:
>
> `docs/architecture.png`

The production architecture is roughly:

```text
                           ┌──────────────────────┐
                           │       Browser        │
                           │    React / React     │
                           │        Flow         │
                           └──────────┬───────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │       Vercel         │
                           │      Next.js         │
                           │                      │
                           │  tRPC / API Routes   │
                           │  Workflow Editor     │
                           │  Webhooks             │
                           └──────────┬───────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                ┌─────────────────┐       ┌─────────────────┐
                │    PostgreSQL   │       │     Inngest     │
                │      Neon       │       │ Workflow Engine │
                └─────────────────┘       └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │ Node Executors   │
                                          │                  │
                                          │ HTTP             │
                                          │ OpenAI           │
                                          │ Anthropic        │
                                          │ Gemini           │
                                          │ Slack            │
                                          │ Discord          │
                                          │ Trading          │
                                          └────────┬─────────┘
                                                   │
                              ┌────────────────────┼──────────────────┐
                              ▼                    ▼                  ▼
                         ┌──────────┐       ┌──────────┐       ┌──────────┐
                         │ Upstash  │       │  Alpaca  │       │ External │
                         │  Redis   │       │   API    │       │ Services │
                         └──────────┘       └─────┬────┘       └──────────┘
                                                  ▲
                                                  │ WebSocket
                                           ┌──────┴───────┐
                                           │   AWS EC2    │
                                           │    Market    │
                                           │   Listener   │
                                           └──────────────┘
```

---

# ⚙️ Workflow Execution

A workflow is stored as a graph consisting of nodes and connections.

```text
Workflow
├── Nodes
├── Connections
└── Executions
```

When a workflow is executed:

```text
User
 ↓
tRPC
 ↓
Inngest Event
 ↓
Load Workflow
 ↓
Topological Sort
 ↓
Node Executor Registry
 ↓
Execute Nodes
 ↓
Shared Execution Context
 ↓
Persist Execution Result
```

The execution engine determines the correct node order using the workflow graph rather than relying on database ordering.

Each node receives the current execution context and can append or transform data for downstream nodes.

For example:

```text
Trigger
   ↓
{
  customer: {...}
}
   ↓
HTTP Request
   ↓
{
  customer: {...},
  apiResponse: {...}
}
   ↓
OpenAI
   ↓
{
  customer: {...},
  apiResponse: {...},
  summary: {...}
}
```

Dynamic values can be referenced through Handlebars-based context interpolation.

---

# 🤖 AI Architecture

AI nodes use the Vercel AI SDK with provider-specific integrations.

```text
Workflow Context
       ↓
Handlebars Prompt
       ↓
Credential Lookup
       ↓
Credential Decryption
       ↓
AI Provider
       ↓
Generated Output
       ↓
Execution Context
```

Supported providers:

| Provider      | Integration |
| ------------- | ----------- |
| OpenAI        | AI SDK      |
| Anthropic     | AI SDK      |
| Google Gemini | AI SDK      |

Credentials are encrypted before being persisted and decrypted only when required by the executor.

---

# 📈 Quantitative Trading

The trading vertical is built directly on top of the workflow execution engine.

Instead of creating a separate strategy system, trading functionality is exposed through workflow nodes.

```text
Market Data
      ↓
Indicator
      ↓
Order
```

This allows the same workflow infrastructure to support both automation and trading.

### Trading Nodes

#### Market Data

Provides OHLCV candle data to the workflow.

#### Indicator

Supports:

* SMA
* EMA
* RSI
* MACD

#### Order

Supports:

* BUY
* SELL
* MARKET
* LIMIT

Orders are executed through the Alpaca paper-trading API.

---

# 📊 Live Market Data

The live trading system uses a dedicated persistent market listener.

The listener maintains a WebSocket connection with Alpaca and forwards market events to the application.

```text
Alpaca WebSocket
       ↓
Market Listener
       ↓
Internal API
       ↓
Workflow / Inngest
       ↓
Market Data Node
       ↓
Indicator
       ↓
Order
```

The market listener is intentionally deployed separately from the Next.js application because it requires a persistent process and long-lived WebSocket connection.

---

# 🧠 Indicator State

Indicator calculations require rolling price history.

Flux separates hot-path state from durable state.

### Hot Path

Rolling price buffers are stored in Upstash Redis:

```text
indicator:{nodeId}:prices
```

This avoids querying PostgreSQL for every market tick.

### Cold Path

Indicator state is periodically synchronized to PostgreSQL through the `IndicatorState` model.

The current implementation synchronizes state every 50 ticks.

This provides a practical tradeoff between:

* low-latency processing
* database load
* recoverability

If the listener or executor restarts, the rolling buffer may need to be rebuilt from recent market data.

---

# 🔁 Idempotent Orders

Workflow execution can be retried by the background execution system.

Trading operations therefore use deterministic client order IDs:

```text
clientOrderId = executionId + nodeId
```

This prevents retries from unintentionally creating duplicate orders.

The same identifier is also persisted with the paper order record.

---

# 📉 Backtesting

Flux can replay historical market data against an existing workflow.

```text
Select Workflow
      ↓
Select Symbol
      ↓
Select Interval
      ↓
Select Date Range
      ↓
Load Historical Candles
      ↓
Replay Candles
      ↓
Execute Workflow
      ↓
Collect Orders
      ↓
Calculate Performance
```

Backtesting produces:

* Equity curve
* Total return
* Maximum drawdown
* Number of trades
* Win rate

The same candle shape is used for live and historical execution, allowing indicator and order logic to remain consistent between the two modes.

---

# 🔂 Shadow Replay

Flux includes a shadow-replay feature for regression testing workflow edits before saving them.

```text
Open Workflow Editor
      ↓
Make unsaved edits
      ↓
Click "Test against history"
      ↓
Select a past execution to replay
      ↓
Run edited graph against the original tick data
      ↓
Compare output diff vs original execution
```

Shadow replay re-runs the modified node graph against the recorded `initialData` from a real past execution, in a dry-run mode where:

* Order nodes never place real orders (shadow mode enforced at executor level)
* The result is compared node-by-node against the original execution output
* A structural diff is produced showing what changed in context values

**Current limitation**: shadow replay requires the source execution to have been triggered via a live "Execute workflow" run or a real market tick. Executions created by `executeBacktest` are not currently eligible because the backtest runner does not record per-node `initialData`.

---

# 🔐 Authentication & Credentials

Flux uses Better Auth for authentication.

Supported authentication includes:

* Email/password
* GitHub OAuth
* Google OAuth

Credentials are stored separately from workflow definitions and encrypted before persistence.

Supported credential types include:

* OpenAI
* Anthropic
* Gemini
* Alpaca
* Binance

---

# 💳 Subscriptions

Flux includes subscription management through Polar.

Protected procedures require authentication, while premium procedures additionally require an active subscription.

This separates:

```text
Authenticated User
```

from:

```text
Subscribed User
```

at the backend procedure level.

---

# 🗄️ Database

Flux uses PostgreSQL through Prisma.

Major models include:

### Authentication

* User
* Session
* Account
* Verification

### Workflow Engine

* Workflow
* Node
* Connection
* Execution
* Credential

### Trading

* IndicatorState
* HistoricalCandle
* PaperPosition
* PaperOrder

---

# 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* React Flow
* Tailwind CSS
* Radix UI
* Jotai

### Backend

* Next.js
* tRPC
* Prisma
* PostgreSQL
* Inngest

### AI

* Vercel AI SDK
* OpenAI
* Anthropic
* Google Gemini

### Trading

* Alpaca
* technicalindicators
* WebSockets

### Infrastructure

* Vercel
* Neon PostgreSQL
* Upstash Redis
* AWS EC2
* Inngest
* Sentry

### Authentication & Billing

* Better Auth
* Polar

---

# ☁️ Production Deployment

Flux uses a hybrid deployment architecture because different components have different runtime requirements.

| Component                     | Platform    |
| ----------------------------- | ----------- |
| Next.js application           | Vercel      |
| API routes / webhooks         | Vercel      |
| Background workflow execution | Inngest     |
| PostgreSQL                    | Neon        |
| Redis                         | Upstash     |
| Persistent market listener    | AWS EC2     |
| Market data / paper trading   | Alpaca      |
| Error monitoring              | Sentry      |

### Why hybrid?

The Next.js application is well suited to serverless deployment, while the market listener requires a persistent process for its long-lived Alpaca WebSocket connection.

This allows each component to use infrastructure appropriate to its workload rather than forcing the entire application into a single deployment model.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Node.js
* Docker
* Docker Compose
* PostgreSQL client (optional)
* API credentials for the services you want to use

---

## 1. Clone the repository

```bash
git clone <repository-url>
cd flux
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Start the local database

Flux uses PostgreSQL in Docker for local development.

```bash
docker compose up -d db
```

The default local connection is:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/flux"
```

---

## 4. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the required values in `.env`.

The application validates required environment variables during startup so configuration errors fail early.

---

## 5. Run database migrations

```bash
npx prisma migrate dev
```

---

## 6. Start the application

```bash
npm run dev
```

Or:

```bash
yarn dev
```

```bash
pnpm dev
```

```bash
bun dev
```

Open:

```text
http://localhost:3000
```

---

# 🌱 Seed the Demo Trading Strategy

Flux includes a seed script that creates an AAPL 10/30 SMA crossover workflow.

```bash
npx tsx scripts/seed-sma-crossover.ts
```

The resulting strategy follows:

```text
AAPL Market Data
       ↓
     SMA 10
       ↓
     SMA 30
       ↓
   Trading Logic
       ↓
      Order
```

This provides a quick way to test the workflow and trading architecture.

---

# 🧪 Testing

Run the test suite with:

```bash
npm run test
```

The project includes tests around trading functionality including:

* backtesting
* equity curve calculations

---

# 📁 Project Structure

```text
src/
├── app/
│   ├── api/
│   ├── executions/
│   ├── trading/
│   └── workflows/
│
├── components/
│   └── ui/
│
├── config/
│   └── node-components.ts
│
├── features/
│   ├── auth/
│   ├── credentials/
│   ├── editor/
│   ├── executions/
│   ├── subscriptions/
│   ├── trading/
│   ├── triggers/
│   └── workflows/
│
├── inngest/
│   ├── functions.ts
│   └── utils.ts
│
├── lib/
│
└── trpc/

services/
└── market-listener/

scripts/
└── seed-sma-crossover.ts

prisma/
├── schema.prisma
└── migrations/
```

---

# 🧩 Engineering Decisions

### Graph-based execution

Workflows are represented as directed graphs instead of hardcoded pipelines. This allows arbitrary node compositions and makes the execution engine independent of the UI.

### Topological execution

Nodes are sorted based on their graph dependencies before execution, ensuring upstream nodes complete before their downstream dependencies.

### Shared execution context

Node outputs are accumulated into a shared runtime context, allowing downstream nodes to dynamically consume previous results.

### Asynchronous execution

Inngest handles workflow execution outside the request lifecycle, allowing long-running and retryable workflows.

### Redis + PostgreSQL

Redis is used for frequently accessed, latency-sensitive indicator state while PostgreSQL provides durable persistence and auditing.

### Adapter-based trading architecture

The `ExchangeAdapter` abstraction isolates exchange-specific functionality from the trading engine, making additional exchange integrations possible without modifying the core workflow architecture.

### Idempotent orders

Deterministic client order IDs make order execution safer when background jobs are retried.

### Shared live/backtest data model

Live market data and historical candles expose the same `Candle` structure downstream, reducing differences between backtesting and live strategy execution.

---

# ⚠️ Current Tradeoffs & Limitations

Flux is an actively developed project and intentionally makes several engineering tradeoffs.

### Indicator state recovery

Redis contains the hot rolling buffer while PostgreSQL is periodically synchronized every 50 ticks. A process failure can therefore require rebuilding recent indicator state from the Alpaca historical API, which the indicator executor does automatically on the next execution.

### Backtesting execution

Historical candles are replayed within a single background execution rather than creating a durable checkpoint for every candle. This reduces overhead but means a failed backtest may need to restart.

### Shadow replay eligibility

Shadow replay currently only works against executions triggered via live workflow runs (manual or market-tick triggered). Executions produced by `executeBacktest` do not record per-node `initialData`, so they cannot be selected as a shadow replay source.

### Paper trading

The trading vertical is designed around paper trading and is not intended to manage real-money trading accounts.

### Market listener

The market listener process is deployed on AWS EC2 and exposes a control HTTP API on port 3001. The internal `/api/internal/market-tick` route it calls on the Next.js app currently has no authentication — any caller who knows the URL can trigger workflow executions. Production hardening (shared secret header validation) is on the roadmap.

---

# 🔮 Roadmap

Planned improvements include:

* [ ] Conditional / branching workflow nodes
* [ ] Retry and timeout configuration per node
* [ ] Improved execution logs and observability
* [ ] Workflow-level error handling
* [ ] Internal service authentication for `/api/internal/market-tick`
* [ ] Shadow replay support for backtest-sourced executions
* [ ] More integrations
* [ ] More advanced trading strategy operators
* [ ] Improved backtesting metrics
* [ ] Additional exchange adapters
* [ ] Production-grade webhook authentication
* [ ] Internal service authentication
* [ ] Rate limiting

---

# 📄 License

This project is currently intended as a personal/portfolio project.
