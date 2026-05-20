# CPU Pipeline Visualizer

An interactive educational platform that simulates a 5-stage MIPS CPU pipeline in real time. Built to look and feel like professional semiconductor engineering software.

![Pipeline Visualizer](https://placeholder.com/screenshot)

## What it does

- **Cycle-by-cycle simulation** of IF → ID → EX → MEM → WB pipeline stages
- **Automatic hazard detection**: RAW data hazards, load-use hazards, control hazards from branches
- **Data forwarding paths** visualized: EX→EX and MEM→EX forwarding
- **Classic timing diagram** — the pipeline grid engineers draw on whiteboards
- **Performance metrics**: CPI, stall cycle breakdown, forwarding efficiency
- **Branch prediction modes**: none (stall), always-not-taken, always-taken, dynamic
- **Save & load simulations** with Supabase authentication
- **7 sample programs** covering basic arithmetic, hazard patterns, Fibonacci, array sum

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Backend | Supabase (Auth + PostgreSQL + Realtime) |
| Deployment | Vercel |

## Local setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/your-username/cpu-pipeline-visualizer
cd cpu-pipeline-visualizer
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in your Supabase project under **Settings → API**.

### 3. Set up the database

In your Supabase project, open the **SQL Editor** and paste the contents of:

```
supabase/migrations/001_init.sql
```

This creates:
- `profiles` table (auto-populated on signup via trigger)
- `simulations` table with RLS policies
- `execution_events` table for history

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/cpu-pipeline-visualizer)

### Manual deploy

1. Push to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Next.js, no config needed

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── auth/page.tsx             # Login/signup
│   ├── dashboard/page.tsx        # Saved simulations
│   ├── simulation/
│   │   ├── page.tsx              # Main simulator workspace
│   │   ├── loading.tsx
│   │   └── error.tsx
│   └── api/simulations/route.ts  # REST API (server-side Supabase)
├── components/
│   ├── layout/SimulatorShell.tsx # Sidebar + top bar
│   ├── editor/InstructionEditor.tsx
│   ├── pipeline/
│   │   ├── PipelineDiagram.tsx   # Animated 5-stage boxes
│   │   ├── PipelineGrid.tsx      # Timing diagram table
│   │   ├── PlaybackControls.tsx
│   │   └── ConfigPanel.tsx
│   ├── hazards/HazardLog.tsx
│   └── analytics/MetricsPanel.tsx
├── lib/
│   ├── pipeline/
│   │   ├── parser.ts             # MIPS assembly parser
│   │   ├── simulator.ts          # Hazard detection + cycle engine
│   │   └── samples.ts            # Built-in example programs
│   └── supabase/
│       ├── client.ts             # Browser client (singleton)
│       ├── server.ts             # Server Component client
│       └── simulations.ts        # CRUD helpers
├── types/pipeline.ts             # All domain types
└── styles/globals.css
```

## Supported instructions

| Type | Instructions |
|------|-------------|
| R-type | `add`, `sub`, `and`, `or`, `slt`, `sll`, `srl`, `jr` |
| I-type | `addi`, `andi`, `ori`, `slti` |
| Memory | `lw`, `sw` |
| Branch | `beq`, `bne` |
| Jump | `j`, `jal` |
| Pseudo | `nop`, `move`, `li` |

Registers support both numeric (`$0`–`$31`) and named (`$t0`, `$s0`, `$ra`, etc.) forms.

## Simulation engine

The simulator processes instructions in two passes:

1. **Scheduling pass** — determines when each instruction enters `IF`, accounting for data and control hazards. With forwarding enabled, EX→EX and MEM→EX paths are applied before inserting stalls. Load-use hazards require 1 mandatory stall cycle regardless of forwarding.

2. **Snapshot pass** — builds a `CycleSnapshot` for every clock cycle, recording which instruction occupies each stage, active stall cycles, hazard records, and forwarding paths active in that cycle.

The UI drives playback by indexing into the precomputed snapshot array — this means scrubbing backward is free.

## Resume description

> **CPU Pipeline Visualizer** — Full-stack web application simulating a 5-stage MIPS CPU pipeline with cycle-accurate hazard detection, data forwarding visualization, and performance analytics. Built with Next.js 15 App Router, TypeScript, Tailwind CSS, Framer Motion, and Supabase. Implements a custom assembly parser and hazard-aware scheduling engine. Deployed on Vercel with serverless API routes and PostgreSQL persistence.

## License

MIT
