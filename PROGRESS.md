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

## MVP Status

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
