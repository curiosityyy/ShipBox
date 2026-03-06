# ShipBox Progress

Web-based Linux dashboard for Claude Code CLI, inspired by the Readout macOS app.

## Tech Stack

- **Backend:** Fastify + SQLite (better-sqlite3 + Drizzle ORM)
- **Frontend:** React 19 + Vite + Tailwind CSS 4 + Recharts
- **Data Source:** Local files from `~/.claude/`

---

## Adopted Improvements (from Codex Review)

### 1. API Validation: zod

- Add `zod` for all API input/output validation
- Use `@fastify/type-provider-zod` for Fastify route schema validation
- Validate settings input, query parameters, and all request bodies
- **Rationale:** Type-safe runtime validation at system boundaries

### 2. Process Management: execa + pidtree

- Replace raw `child_process.execSync` with `execa` for shell commands (port scanning, process detection)
- Add `pidtree` for killing process trees (more reliable than single PID kill)
- **Rationale:** Better error handling, cleaner API, cross-platform compatibility

### 3. Testing: vitest

- Add `vitest` as test framework for both server and web packages
- Start with unit tests for core services (claude-data parser, git-scanner, cost calculator)
- **Rationale:** Fast, TypeScript-native, Vite-compatible

### 4. Code Quality (planned, not yet implemented)

- eslint + prettier + husky + lint-staged + commitlint (noted for future)
- **Rationale:** Defer to Phase 2 to avoid slowing down MVP iteration

---

## Deferred (with Rationale)

### React 18 downgrade

- Current MVP runs fine on React 19 with all dependencies
- Will downgrade only if compatibility issues arise

### Recharts to ECharts

- Recharts handles current bar/line charts well
- Will switch to ECharts only when "When You Work" heatmap needs it

### REST to tRPC

- REST is simpler for MVP and easier to debug
- May adopt tRPC when API surface grows significantly

### ws to socket.io

- Current polling (3s) works for Live page
- Will add proper WebSocket when real-time needs increase

---

## Current Architecture

```
ShipBox/
├── packages/
│   ├── server/    # Fastify + SQLite + zod + execa
│   └── web/       # React 19 + Vite + Tailwind + Recharts
├── CLAUDE.md      # Full project plan + Readout survey
├── PROGRESS.md    # This file
└── screenshots/   # Readout app reference screenshots
```

---

## Phase 1: MVP Status

- [x] Project scaffolding (monorepo, TypeScript)
- [x] Backend: Fastify server with REST API
- [x] Frontend: React SPA with sidebar + routing (25 pages)
- [x] Dashboard: Real data from ~/.claude/ (sessions, costs, tools)
- [x] Tools page: Full analytics (distribution, sequences, commands, files)
- [x] Repos page: Git repo scanning with status
- [x] Live page: Active session monitoring (polling)
- [x] Ports page: Open port detection grouped by process
- [x] Settings page: Scan directories management
- [x] 16 stub pages ready for implementation
- [x] Adopted: zod validation, execa, pidtree, vitest

---

## Phase 2: Monitor (completed 2026-03-06)

All 6 Monitor pages are now fully functional with real data.

### Sessions History
- [x] Frontend page: `packages/web/src/pages/Sessions.tsx`
- [x] Backend API: `GET /api/sessions` (was already implemented)
- [x] 4 stat cards: Total Sessions, Messages, Tool Calls, Total Cost
- [x] Session list with summary, project, model badge, tool count, cost
- [x] Sorted by most recent, time-ago display

### Transcripts with Search
- [x] Backend API: `GET /api/transcripts?q=&time=` (new)
  - Full-text search across all session JSONL files
  - Time filters: today, week, month, all time
  - Returns messages with role, text, model, tool usage
- [x] Frontend page: `packages/web/src/pages/Transcripts.tsx`
  - Debounced search (300ms)
  - Time filter buttons (All Time / Today / This Week / This Month)
  - Expandable transcript cards with full message history
  - User/Assistant avatars, model labels, tool use badges
  - Search result highlighting (yellow)

### Costs Tracking + Charts
- [x] Frontend page: `packages/web/src/pages/Costs.tsx`
- [x] Backend API: `GET /api/costs` (was already implemented)
- [x] 4 stat cards: Total Cost, Today, Avg/Day, Days Tracked
- [x] Daily cost bar chart (Recharts) with proper dark tooltip
- [x] Cost by Model horizontal bar chart with color-coded models
- [x] Daily breakdown table with per-model cost split

### Previously Completed (Phase 1)
- [x] Live session tracking (polling, 3s interval)
- [x] Tools analytics + charts (distribution, sequences, commands, files)
- [x] Ports monitoring (process groups, PID display)

### UI/UX Improvements (during Phase 2)
- [x] Switched fonts from DM Sans/Syne to system font stack (SF Pro on macOS)
- [x] Sidebar: clean selected state (subtle dark background vs green gradient)
- [x] Sidebar: increased font weight to semibold
- [x] Overview card titles: added colored icons (Activity, Cost by Model, etc.)
- [x] Activity chart: fixed white cursor to transparent green
- [x] Recent Sessions: simplified hover style (removed green left border)
- [x] Sidebar divider: subtle solid line instead of green gradient
