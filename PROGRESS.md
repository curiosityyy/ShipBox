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

---

## Phase 3: Workspace (completed 2026-03-06)

All 5 Workspace pages (beyond Repos) are now fully functional with real data.

### Backend: New Route File
- [x] `packages/server/src/routes/workspace.ts` - 5 new endpoints
  - `GET /api/work-graph` - repo activity data with stats (active/idle/dormant/totalCommits)
  - `GET /api/timeline` - git commit timeline across all repos (last 20 per repo, sorted by date)
  - `GET /api/diffs` - recent file changes from git diff (HEAD~5..HEAD per repo)
  - `GET /api/snapshots` - current branch states for all repos
  - `POST /api/snapshots/save` - save snapshot (git stash dirty repos + metadata to DB)
- [x] Registered in `packages/server/src/index.ts`
- [x] Reuses existing `scanDirectories` from git-scanner service

### Frontend: 5 New Pages
- [x] `packages/web/src/pages/WorkGraph.tsx` - 4 stat cards, repos grouped by status with colored dots
- [x] `packages/web/src/pages/RepoPulse.tsx` - repo cards sorted by activity, branch/dirty/commits info
- [x] `packages/web/src/pages/Timeline.tsx` - vertical timeline with colored repo dots, commit details
- [x] `packages/web/src/pages/Diffs.tsx` - file changes grouped by repo, +additions/-deletions display
- [x] `packages/web/src/pages/Snapshots.tsx` - branch states list, Save Snapshot button with mutation

### API Client
- [x] Added `postJson` helper and 5 new methods to `packages/web/src/lib/api.ts`

### App Router
- [x] Replaced 5 StubPage routes with real components in `packages/web/src/App.tsx`

---

## Phase 4: Config + Health (completed 2026-03-06)

### Backend: Health Routes
- [x] New route file: `packages/server/src/routes/health.ts`
- [x] `GET /api/hygiene` - zombie claude process detection, large log files, stale sessions
- [x] `GET /api/deps` - dependency health (package.json scan, lockfile detection)
- [x] `GET /api/worktrees` - repos with multiple git worktrees
- [x] `GET /api/env-files` - .env file scanner across repos
- [x] `GET /api/lint-claude` - CLAUDE.md file finder (global + per-repo)
- [x] All endpoints gracefully handle empty scan directories

### Frontend: Config Pages (4 pages)
- [x] `Skills.tsx` - lists skills with name, source badge (global/repo), path
- [x] `Agents.tsx` - lists detected agents with name and path
- [x] `Memory.tsx` - shows each project MEMORY.md content (preformatted)
- [x] `Hooks.tsx` - hooks grouped by event name with JSON config display

### Frontend: Health Pages (5 pages)
- [x] `Hygiene.tsx` - stat cards (issues/critical/warnings), severity-colored issue list
- [x] `Dependencies.tsx` - repos with dep/devDep counts, lockfile status badge
- [x] `Worktrees.tsx` - multi-worktree repos with path/branch/HEAD per worktree
- [x] `Env.tsx` - .env files with repo name, path, file size
- [x] `Lint.tsx` - CLAUDE.md files with project, path, line count, size

### Integration
- [x] API client updated with 5 new methods (hygiene, deps, worktrees, envFiles, lintClaude)
- [x] App.tsx: all 9 StubPage routes replaced with real components
- [x] Removed unused lucide-react imports from App.tsx
- [x] TypeScript compiles cleanly for both server and web packages

---

## Phase 5: Setup + Assistant (completed 2026-03-06)

### Setup Page
- [x] Backend API: `GET /api/setup` in config.ts - reads ~/.claude/settings.json
  - Returns mcpServers, hooks, permissions sections
- [x] Frontend: `packages/web/src/pages/Setup.tsx`
  - 3 stat cards: MCP Servers, Hooks, Permissions counts
  - Sections listing each config entry with glass-card styling
  - Per-section empty states

### Assistant Page
- [x] Frontend: `packages/web/src/pages/Assistant.tsx`
  - Non-functional chat UI shell (visual placeholder for future implementation)
  - Model selector (disabled), text input (disabled), send button (disabled)
  - Centered "Start a conversation with Claude" message

### All 25 Pages Complete
- [x] No StubPage usage remaining - all pages have real implementations
- [x] All server tests pass (8/8)
- [x] TypeScript compiles cleanly (server + web)
- [x] All APIs return real data

---

## UI Polish: Readout Parity (2026-03-06)

Compared ShipBox against Readout screenshots and made targeted improvements.

### Sessions Page
- [x] Sessions are now clickable/expandable to show transcript replay
- [x] Each session shows "Claude Code" badge, user badge, model, tool count, cost
- [x] Clicking a session expands it inline with full message history (user/assistant avatars)

### Diffs Page
- [x] Redesigned to match Readout's session-based format
- [x] Grouped by date (Today/Yesterday/etc.)
- [x] Session cards with "Claude Code" badge, "Users/byli" badge, file count, edit count (yellow), time ago
- [x] "Replay" button with play icon and chevron (expands to show file list with +/- counts)
- [x] 2-column stat cards (Sessions, Files Changed) matching Readout layout

### Tools Page
- [x] Added "Usage Over Time" bar chart (blue, matching Readout)
- [x] Added "Busiest" callout with flame icon below chart
- [x] Added icons before all section titles (BarChart3, Repeat, FileEdit, Terminal)
- [x] Backend: normalized daily tool data from dict to array format
- [x] Tool labels now use white text (#e2e8f0) instead of gray for better readability

### Overview Page (previously done)
- [x] Centered compact StatCards matching Readout
- [x] Simplified PageHeader (no gradient line)
- [x] Clickable cards with chevron arrows (Activity, Cost by Model, Recent Sessions)
- [x] Hygiene warning banner (yellow)
- [x] Quick-access cards (Skills, Agents, Memory, Repos)

---

## Frontend Optimization (2026-03-06)

### Skeleton Loading States
- [x] Created reusable `PageSkeleton` component (`components/PageSkeleton.tsx`)
- [x] Replaced all "Loading..." text across 25 pages with shimmer skeleton loading
- [x] Skeleton adapts card count per page (0-4 stat cards)
- [x] Transcripts search shows 3 skeleton cards while loading

### Sidebar Active Indicator
- [x] Added blue left accent border (`before:` pseudo-element) on active nav items
- [x] Matches Readout's active state styling (blue left bar + dark background)
- [x] Applied to both nav items and Settings link

### Overview Page - "When You Work" Heatmap
- [x] Added 7x24 heatmap grid (Mon-Sun x 24 hours) matching Readout layout
- [x] Restructured to 2x2 grid: Activity | When You Work / Cost by Model | Recent Sessions
- [x] Heatmap populated from recent session timestamps with green intensity scaling
- [x] Hour labels (12a, 6a, 12p, 6p) along bottom axis

### Page Transitions
- [x] Added `key={location.pathname}` to DashboardLayout for route-change animations
- [x] `animate-fade-in` now includes subtle translateY(4px) for smoother feel
- [x] Faster easing (0.3s cubic-bezier) for snappier transitions

### Components
- [x] New: `PageSkeleton.tsx` - reusable loading skeleton with configurable stat cards
