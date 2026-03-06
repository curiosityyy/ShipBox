# ShipBox

Web-based dashboard for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI. Monitor sessions, track costs, search transcripts, and manage your workspace — all from the browser.

Inspired by [Readout](https://github.com/anthropics/readout) (macOS-only), ShipBox brings the same capabilities to any platform as a local web app.

## Features

**25 pages** across 6 sections:

| Section | Pages | Description |
|---------|-------|-------------|
| **Overview** | Dashboard, Assistant | Greeting, stat cards, activity chart, cost breakdown, recent sessions |
| **Monitor** | Live, Sessions, Transcripts, Tools, Costs, Setup, Ports | Real-time session tracking, full-text transcript search, tool analytics, cost charts, port monitoring |
| **Workspace** | Repos, Work Graph, Repo Pulse, Timeline, Diffs, Snapshots | Git repo scanning, commit timeline, diff viewer, snapshot management |
| **Config** | Skills, Agents, Memory, Hooks | Browse and manage Claude Code configuration |
| **Health** | Hygiene, Dependencies, Worktrees, Env, Lint | System health checks, dependency audits, env file detection, CLAUDE.md linting |
| **Settings** | Scan directories, cost budgets, sidebar customization | App configuration |

### Implemented

- **Dashboard** — Stat cards, 30-day activity chart, cost by model, recent sessions, tool usage overview
- **Live** — Active session monitoring with 3-second polling
- **Sessions** — Full session history with model, tool count, and cost per session
- **Transcripts** — Full-text search with time filters (Today/Week/Month/All), expandable message history with search highlighting
- **Tools** — Tool distribution, common sequences, most edited files, top bash commands
- **Costs** — Daily cost chart, model breakdown with color coding, daily cost table
- **Ports** — Open port detection grouped by process
- **Repos** — Git repo scanning with branch, status, and dirty detection
- **Settings** — Scan directory management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Backend | Fastify + SQLite (better-sqlite3 + Drizzle ORM) |
| Frontend | React 19 + Vite + Tailwind CSS 4 |
| Charts | Recharts |
| State | TanStack Query |
| Validation | Zod |
| Testing | Vitest |
| Package Manager | pnpm |
| Language | TypeScript (full stack) |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Claude Code CLI installed (`~/.claude/` directory must exist)

### Install & Run

```bash
git clone https://github.com/MetaSearch-IO/ShipBox.git
cd ShipBox
pnpm install
pnpm dev
```

Open http://localhost:5173 in your browser. The backend runs on http://localhost:3141.

### Data Source

ShipBox reads local data only — no cloud, no accounts:

- `~/.claude/projects/` — Session JSONL files
- `~/.claude/settings.json` — Configuration
- `~/.claude/MEMORY.md` — Claude memory
- `~/.claude/skills/`, `~/.claude/agents/` — Skills and agents
- Git repos in configured scan directories

## Project Structure

```
ShipBox/
├── packages/
│   ├── server/          # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/  # REST API endpoints
│   │   │   ├── services/# Business logic (claude-data, git-scanner)
│   │   │   └── db/      # SQLite schema (Drizzle ORM)
│   │   └── package.json
│   └── web/             # React frontend
│       ├── src/
│       │   ├── pages/   # 25 page components
│       │   ├── components/
│       │   └── lib/     # API client
│       └── package.json
├── CLAUDE.md            # Project plan & architecture
├── PROGRESS.md          # Implementation progress
└── pnpm-workspace.yaml
```

## Roadmap

- [x] **Phase 1** — Foundation (scaffold, routing, dashboard, repos, settings)
- [x] **Phase 2** — Monitor (sessions, transcripts, tools, costs, ports, live)
- [ ] **Phase 3** — Workspace (work graph, repo pulse, timeline, diffs, snapshots)
- [ ] **Phase 4** — Config + Health (skills, agents, memory, hooks, hygiene, deps, worktrees, env, lint)
- [ ] **Phase 5** — Assistant + Polish (AI chatbot, responsive design, keyboard shortcuts)

## License

MIT
