# ShipBox - Project Plan

## 1. Survey: Readout App Complete Analysis

Readout (v0.0.8) is a native macOS (Swift, arm64) desktop app that serves as a GUI dashboard for Claude Code CLI. It reads `~/.claude/` local data (sessions, MEMORY.md, settings.json, skills, agents) and git repos to provide monitoring, workspace management, and configuration.

### All Pages Surveyed (25 total):

#### Overview (2 pages)
| Page | Description | Key Elements |
|------|-------------|-------------|
| **Readout (Dashboard)** | Main overview | Greeting, 4 stat cards (Repos/Commits Today/Sessions/Est. Cost), Activity 30d chart, When You Work heatmap, Cost by Model, Recent Sessions list, quick-access cards (Skills/Agents/Memory/Repos), hygiene warning banner |
| **Assistant** | Built-in AI chatbot | Multi-provider support (Anthropic/OpenAI/Google), model selector, chat interface, "Add API Key" onboarding |

#### Monitor (7 pages)
| Page | Description | Key Elements |
|------|-------------|-------------|
| **Live** | Real-time session monitor | 3 stat cards (Sessions/Generating/Memory MB), active session list with tty, duration, memory |
| **Sessions** | Session history | Historical session data from agent history and usage logs |
| **Transcripts** | Searchable transcripts | Search bar, time filters (Today/This Week/This Month/All Time), full-text search |
| **Tools** | Tool usage analytics | 3 stats (Total Calls/Files Touched/Avg per Session), "All Projects" dropdown filter, Usage Over Time chart (7d/14d/30d), Tool Distribution horizontal bar chart (color-coded by tool), Common Sequences (tool pairs), Most Edited Files (file + repo + count), Top Commands (bash commands ranked: source/ls/osascript/etc) |
| **Costs** | Cost tracking | Cost charts, model breakdown, daily cost bars |
| **Setup** | MCP/hooks/plugins viewer | Shows configured MCP servers, hooks, plugins from agent settings files |
| **Ports** | Open port monitor | 3 stats (Ports/Processes/by type), process tree with port numbers |

#### Workspace (6 pages)
| Page | Description | Key Elements |
|------|-------------|-------------|
| **Repos** | Git repo scanner | Scans configured directories for git repos, add via Settings |
| **Work Graph** | Repo activity viz | 4 stats (Active/Idle/Dormant/Commits), repo list |
| **Repo Pulse** | Repo health pulse | Activity monitoring per repo |
| **Timeline** | Git timeline | Git commit timeline visualization |
| **Diffs** | File change tracking | Stats (Sessions/Files Changed), session-attributed diffs with "Replay" button, date grouping |
| **Snapshots** | Git snapshot mgmt | Stats (Repos/Snapshots/Dirty), Current Branches list, Save Snapshot button |

#### Config (4 pages)
| Page | Description | Key Elements |
|------|-------------|-------------|
| **Skills** | Skills browser | Reads ~/.claude/skills/ and repo .claude/skills/, refresh button |
| **Agents** | Agents browser | Reads .claude/agents/*.md files |
| **Memory** | Memory viewer | Displays MEMORY.md content, persists across sessions |
| **Hooks** | Hooks viewer | Reads ~/.claude/settings.json "hooks" key |

#### Health (5 pages)
| Page | Description | Key Elements |
|------|-------------|-------------|
| **Hygiene** | System health | Critical issues ring chart, zombie process detection with "Kill Process" button, auto-diagnose setup |
| **Dependencies** | Dependency health | Health/Graph tabs, checks package.json repos |
| **Worktrees** | Git worktree mgmt | Shows repos with multiple worktrees |
| **Env** | Env file scanner | Detects .env files across all repos |
| **Lint** | CLAUDE.md linter | Finds CLAUDE.md files in repos and global config |

#### Settings (separate page, pinned at sidebar bottom)
- **Rescan Workspace**: "Refresh all data" button
- **Scan Directories**: Configure dirs to scan for git repos (default ~/project), up to 2 levels deep, Add Directory / Scan for New buttons
- **Readout Assistant**: API key management for Anthropic/OpenAI/Gemini with radio selector, model selection (Haiku/Sonnet/Opus), "Paste" button for API keys
- **General**: Launch at login toggle, auto-update toggle, Check for Updates button, Export Log button
- **Agents**: Detected agents with enable/disable toggles (Claude Code enabled at /Users/byli/.claude, Codex not installed)
- **Sidebar**: "Customize Sidebar" + "Reset to Default" - show/hide sidebar items
- **Cost Budget**: Daily $ and Monthly $ budget inputs, Alert threshold slider (default 80%), set to $0 to disable
- **Footer**: Version info, copyright, sponsor link

### Design Patterns Observed
- **Dark theme** with dark gray/navy background (#1a1a2e ~ #16213e)
- **Left sidebar**: Fixed width (~200px), grouped sections with headers (Overview/Monitor/Workspace/Config/Health), icon + label items, active item highlighted in blue with left border accent, Settings pinned at sidebar bottom with gear icon
- **Stat cards**: 2-4 cards in a row at top of each page showing key metrics with colored dots (blue/green/yellow)
- **Count badges**: Page titles have count badges (e.g. "Tools 140", "Live 1", "Diffs 1")
- **Empty states**: Centered gray icon + bold message + hint text (e.g. "No repos found" + "Readout looks for git repos in your configured scan directories. Add directories in Settings.")
- **Charts**: Bar charts (Usage Over Time), heatmaps (When You Work), horizontal bar distributions (Tool Distribution, Top Commands) with color coding per category
- **Data tables**: Horizontal bar + label + count format for ranked lists
- **Session cards**: Show session title, agent badge (Claude Code), user badge, file count, edit count, time ago, "Replay" button
- **Data source**: All local filesystem (~/.claude/, git repos), no cloud/server needed
- **Scrollable content area**: Content area scrolls independently from sidebar

### Screenshots Reference
All 50 screenshots (25 pages x top/bottom scroll positions) are saved in `./screenshots/`:
- Format: `{number}_{page_name}_{top|bottom}.png`
- Example: `06_tools_top.png`, `25_settings_bottom.png`

---

## 2. ShipBox Architecture Plan

### Product Vision
ShipBox is a web-based Linux dashboard for Claude Code CLI, providing the same monitoring, workspace management, and configuration capabilities as Readout but running as a local web application accessible via browser.

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | Node.js 20+ | Native filesystem access, git integration, process monitoring |
| **Backend Framework** | Fastify | Lightweight, fast, plugin ecosystem, TypeScript support |
| **Frontend Framework** | React 19 + Vite | Fast build, modern React features, HMR |
| **UI Library** | shadcn/ui + Tailwind CSS 4 | Dark theme out of box, customizable components, matches Readout aesthetic |
| **Charts** | Recharts | React-native charting, bar/line/heatmap support |
| **State Management** | TanStack Query | Server state caching, real-time polling, WebSocket integration |
| **Real-time** | WebSocket (native) | Live session monitoring, port scanning updates |
| **Git Integration** | simple-git | Node.js git operations (log, diff, status, worktree) |
| **Process Monitoring** | ps-list + node:child_process | Port scanning, zombie detection, process management |
| **Database** | SQLite (via better-sqlite3) | Local-first, zero-config, stores session history/cost aggregations/snapshots |
| **ORM** | Drizzle ORM | Lightweight, TypeScript-first, great SQLite support |
| **Bundler/Package Manager** | pnpm + Vite | Fast installs, efficient disk usage |
| **Language** | TypeScript (full stack) | Type safety across frontend/backend |

### Architecture

```
shipbox/
├── packages/
│   ├── server/                 # Fastify backend
│   │   ├── src/
│   │   │   ├── index.ts        # Entry point, server setup
│   │   │   ├── routes/         # REST API + WebSocket routes
│   │   │   │   ├── dashboard.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── tools.ts
│   │   │   │   ├── costs.ts
│   │   │   │   ├── repos.ts
│   │   │   │   ├── config.ts   # Skills/Agents/Memory/Hooks
│   │   │   │   ├── health.ts   # Hygiene/Deps/Worktrees/Env/Lint
│   │   │   │   ├── ports.ts
│   │   │   │   ├── settings.ts
│   │   │   │   └── assistant.ts
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── claude-data.ts     # Parse ~/.claude/ files
│   │   │   │   ├── git-scanner.ts     # Scan repos, diffs, timeline
│   │   │   │   ├── session-tracker.ts # Live session monitoring
│   │   │   │   ├── cost-calculator.ts # Token/cost aggregation
│   │   │   │   ├── port-scanner.ts    # lsof/ss based port scanning
│   │   │   │   ├── process-monitor.ts # Zombie detection, kill
│   │   │   │   └── file-watcher.ts    # Watch ~/.claude/ for changes
│   │   │   ├── db/
│   │   │   │   ├── schema.ts          # Drizzle schema
│   │   │   │   └── migrations/
│   │   │   └── ws/
│   │   │       └── live.ts            # WebSocket handlers
│   │   └── package.json
│   │
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── layouts/
│       │   │   └── DashboardLayout.tsx  # Sidebar + content area
│       │   ├── pages/                   # 1:1 mapping to Readout pages
│       │   │   ├── Overview.tsx
│       │   │   ├── Assistant.tsx
│       │   │   ├── Live.tsx
│       │   │   ├── Sessions.tsx
│       │   │   ├── Transcripts.tsx
│       │   │   ├── Tools.tsx
│       │   │   ├── Costs.tsx
│       │   │   ├── Setup.tsx
│       │   │   ├── Ports.tsx
│       │   │   ├── Repos.tsx
│       │   │   ├── WorkGraph.tsx
│       │   │   ├── RepoPulse.tsx
│       │   │   ├── Timeline.tsx
│       │   │   ├── Diffs.tsx
│       │   │   ├── Snapshots.tsx
│       │   │   ├── Skills.tsx
│       │   │   ├── Agents.tsx
│       │   │   ├── Memory.tsx
│       │   │   ├── Hooks.tsx
│       │   │   ├── Hygiene.tsx
│       │   │   ├── Dependencies.tsx
│       │   │   ├── Worktrees.tsx
│       │   │   ├── Env.tsx
│       │   │   ├── Lint.tsx
│       │   │   └── Settings.tsx
│       │   ├── components/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── StatCard.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   ├── charts/
│       │   │   │   ├── ActivityChart.tsx
│       │   │   │   ├── HeatmapChart.tsx
│       │   │   │   ├── BarDistribution.tsx
│       │   │   │   └── CostChart.tsx
│       │   │   └── shared/
│       │   │       ├── SearchInput.tsx
│       │   │       ├── TimeFilter.tsx
│       │   │       └── PageHeader.tsx
│       │   ├── hooks/
│       │   │   ├── useWebSocket.ts
│       │   │   └── usePolling.ts
│       │   └── lib/
│       │       ├── api.ts              # API client
│       │       └── utils.ts
│       └── package.json
│
├── package.json                # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── drizzle.config.ts
```

### Database Schema (SQLite)

```sql
-- Cached session data (parsed from ~/.claude/ JSONL files)
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    project_path TEXT,
    model TEXT,
    started_at INTEGER,
    ended_at INTEGER,
    input_tokens INTEGER,
    output_tokens INTEGER,
    cost_usd REAL,
    tool_calls INTEGER,
    summary TEXT
);

-- Tool usage tracking
CREATE TABLE tool_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES sessions(id),
    tool_name TEXT,
    timestamp INTEGER,
    file_path TEXT,
    sequence_prev TEXT  -- for Common Sequences
);

-- Cost aggregation cache
CREATE TABLE daily_costs (
    date TEXT PRIMARY KEY,
    total_cost REAL,
    by_model TEXT  -- JSON: {"sonnet": 1.2, "opus": 3.5}
);

-- Repo scan cache
CREATE TABLE repos (
    path TEXT PRIMARY KEY,
    name TEXT,
    last_commit_at INTEGER,
    branch TEXT,
    status TEXT,  -- active/idle/dormant
    dirty INTEGER DEFAULT 0
);

-- Snapshots
CREATE TABLE snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_path TEXT,
    branch TEXT,
    commit_hash TEXT,
    created_at INTEGER,
    label TEXT
);

-- Bash command tracking (for Top Commands)
CREATE TABLE bash_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES sessions(id),
    command TEXT,
    timestamp INTEGER
);

-- App settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT  -- JSON
);

-- Cost budget config
CREATE TABLE cost_budget (
    id INTEGER PRIMARY KEY DEFAULT 1,
    daily_limit REAL DEFAULT 0,
    monthly_limit REAL DEFAULT 0,
    alert_threshold REAL DEFAULT 0.8
);
```

### UI/UX Design Spec

#### Theme
- **Background**: `#0f1117` (main), `#161b22` (sidebar), `#1c2333` (cards)
- **Text**: `#e6edf3` (primary), `#8b949e` (secondary)
- **Accent**: `#2f81f7` (blue, active items), `#3fb950` (green, success), `#f85149` (red, critical)
- **Border**: `#30363d`
- Full dark mode only (matching Readout's design)

#### Layout
- **Sidebar** (240px fixed): Collapsible groups (Overview/Monitor/Workspace/Config/Health), Settings pinned at bottom
- **Content area**: Scrollable, max-width 1200px centered, 24px padding
- **Stat cards**: CSS Grid, responsive 2-4 columns
- **Page pattern**: PageHeader (title + count badge) -> Stat cards -> Main content

#### Responsive Behavior
- Desktop (>1024px): Full sidebar + content
- Tablet (768-1024px): Collapsible sidebar (icon-only mode)
- Mobile (<768px): Bottom navigation bar, full-width content

#### Key Interactions
- **Live page**: Auto-refresh via WebSocket (1s interval for active sessions)
- **Transcripts**: Debounced search (300ms), infinite scroll
- **Diffs**: Syntax-highlighted diff viewer (monaco-editor or highlight.js)
- **Settings**: Form with auto-save (debounced 500ms)
- **Hygiene**: "Kill Process" with confirmation dialog
- **Snapshots**: "Save Snapshot" triggers git stash + metadata save

### Data Flow

```
~/.claude/                          ShipBox Server              Browser
┌─────────────┐    file watcher    ┌──────────────┐   REST/WS  ┌─────────┐
│ projects/    │ ─────────────────> │              │ <────────> │         │
│ settings.json│                   │   Fastify    │            │  React  │
│ MEMORY.md    │    parse + cache   │   + SQLite   │            │   SPA   │
│ skills/      │ ─────────────────> │              │            │         │
│ agents/      │                   │              │            │         │
└─────────────┘                    └──────────────┘            └─────────┘
                                          │
Git Repos                                 │ simple-git
┌─────────────┐                           │
│ ~/project/* │ <─────────────────────────┘
└─────────────┘
```

### Implementation Phases

#### Phase 1: Foundation (MVP)
- Project scaffolding (monorepo, TS config, Vite, Fastify)
- Sidebar + routing (all 25 pages as stubs)
- Dashboard page with real data from ~/.claude/
- Settings page (scan directories, basic config)
- Repo scanning

#### Phase 2: Monitor
- Live session tracking (WebSocket)
- Sessions history
- Transcripts with search
- Tools analytics + charts
- Costs tracking + charts
- Ports monitoring

#### Phase 3: Workspace
- Work Graph
- Repo Pulse
- Git Timeline
- Diffs viewer with syntax highlighting
- Snapshots save/restore

#### Phase 4: Config + Health
- Skills/Agents/Memory/Hooks viewers
- Hygiene checks + zombie process kill
- Dependencies health
- Worktrees management
- Env file scanner
- CLAUDE.md linter

#### Phase 5: Assistant + Polish
- Built-in AI assistant (multi-provider)
- Responsive design
- Keyboard shortcuts
- System tray integration (optional, via Electron/Tauri wrapper)
