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

### Assistant Page (fully functional — 2026-03-09)
- [x] Backend: `POST /api/chat` in `routes/chat.ts` — spawns `claude` CLI via SSE
  - Resolves `node` + `claude` binary paths at startup
  - `minimalEnv()` with only essential vars (strips all `CLAUDE*` to avoid nested-session detection)
  - Spawns `node claude-script` directly (not via shebang) for reliable env isolation
  - `reply.hijack()` for Fastify SSE; uses `raw.on("close")` (not `req.raw`) for cleanup
  - Supports `--resume <sessionId>`, `--model`, `--dangerously-skip-permissions`
- [x] Frontend: `packages/web/src/pages/Assistant.tsx` — full Claude Code web experience
  - SSE streaming with all event types: `init`, `assistant`, `tool_result`, `result`, `thinking`
  - Markdown rendering via `react-markdown` + `remark-gfm` (tables, code blocks, inline code, lists)
  - Code blocks with language label + copy button
  - Tool cards with colored icons, inline summary, expandable input/result views
  - Thinking blocks (collapsible, purple accent)
  - Model selector (Opus/Sonnet/Haiku) with descriptions
  - Session continuity via `--resume` with session ID in header
  - Stop button (abort streaming), New conversation button, turn counter
  - Cost + duration display per response, Claude Code version in footer
  - Copy button on hover for assistant text
  - Keyboard: Enter to send, Shift+Enter for newline

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

---

## AI Assistant: Full Implementation (2026-03-09)

从非功能的 UI shell 升级为完整可用的 Claude Code Web 前端。

### Backend: `packages/server/src/routes/chat.ts`
- [x] `POST /api/chat` — SSE 流式接口，spawn `claude` CLI 子进程
- [x] `minimalEnv()` — 仅传递 6 个必要环境变量 (HOME, USER, PATH, SHELL, TERM, LANG)
  - 剥离所有 `CLAUDE*` 变量，避免嵌套会话检测 (nested-session detection)
- [x] 直接用 `node` 执行 claude 脚本，不依赖 shebang (`#!/usr/bin/env node`)
- [x] 启动时通过 `which claude` / `which node` 解析二进制路径
- [x] 修复 Fastify SSE 生命周期 bug:
  - `reply.hijack()` 后 `req.raw.on("close")` 会立即触发 → 改用 `raw.on("close")`
- [x] 支持 `--resume <sessionId>` 会话恢复、`--model` 模型选择
- [x] `--dangerously-skip-permissions` 免权限确认

### Frontend: `packages/web/src/pages/Assistant.tsx` — 完整重写
- [x] SSE 流式解析，处理全部事件类型：
  - `system.init` — 获取 session_id, model, tools, cwd, version
  - `assistant` — text / tool_use / thinking content blocks
  - `tool_result` — 工具执行结果，关联到对应 tool_use
  - `result` — 总 cost、duration、turn 数
- [x] Markdown 渲染 (`react-markdown` + `remark-gfm`)
  - 表格：深色主题样式，header 区分，rounded border
  - 代码块：语言标签 + 复制按钮 + 深色背景
  - 内联代码：pill 样式，border + 背景
  - 列表、引用、标题、链接、分割线
- [x] Tool Cards — 工具调用可视化
  - 每种工具独立颜色图标 (Bash=黄, Read=蓝, Edit=绿, Grep=紫, Glob=青, Web=橙)
  - 内联摘要 (命令内容 / 文件路径 / 搜索 pattern)
  - 可展开 input (代码图标) 和 result (眼睛图标)
  - 错误状态红色 badge，成功绿色小圆点
  - 未展开时显示结果首行预览
- [x] Thinking Blocks — 思考过程展示
  - 紫色 accent (Sparkles 图标)
  - 折叠/展开，折叠时显示前 120 字预览
  - 流式时显示 spinning loader
- [x] 模型选择器
  - Opus / Sonnet / Haiku，带描述 (Most capable / Balanced / Fastest)
  - 下拉菜单带动画，外部点击关闭
  - streaming 期间 disabled
- [x] 会话管理
  - `--resume` 自动传递 session_id 保持对话连续性
  - 头部显示 session_id (前 8 位) + 绿色指示灯
  - "+ New" 按钮清空对话开始新会话
  - Turn 计数器
- [x] 流式交互体验
  - "Thinking..." 加载状态（spinner + 文字）
  - 绿色光标脉冲动画
  - Stop 按钮（红色，AbortController 中断请求）
  - 响应完成后显示 model badge + 耗时 + 费用
- [x] 文本复制
  - 每条 assistant 消息 hover 显示复制按钮
  - 代码块独立复制按钮，复制后显示绿色 ✓
- [x] 输入区域
  - 自动调高 textarea (最大 160px)
  - Enter 发送，Shift+Enter 换行
  - placeholder "Ask anything..."
  - streaming 期间 disabled + 降低透明度
- [x] 信息展示
  - CWD 路径 (~ 缩写) 显示在头部
  - Claude Code 版本号显示在 footer
  - 键盘快捷键提示

### 输入区域重设计 (Claude.ai 风格)
- [x] 统一输入容器：textarea + model selector + send button 在同一个 rounded-2xl 容器内
  - 移除了 Enter/Shift+Enter 键盘提示文字
  - 移除了独立的 model selector 和 send button 外部元素
  - Model selector 在容器内部左下，Send button 在容器内部右下
  - Send button: 白底深色图标 (有内容时) / 灰色半透明 (无内容时)
  - Stop button: 红色圆形，替换 send button 位置
  - focus 时容器边框变为 accent green
- [x] 移除主容器的 border 和 gradient background，让页面更通透
- [x] Header 简化：session ID 用更淡的颜色，减少视觉噪音

### 多会话管理 (Multi-Session Management)
- [x] **数据库**: `assistant_sessions` 表 (id, title, model, cwd, created_at, updated_at, last_message, message_count, total_cost_usd)
  - Schema: `packages/server/src/db/schema.ts`
  - DDL: `packages/server/src/db/index.ts` (CREATE TABLE IF NOT EXISTS)
- [x] **后端 CRUD**: `packages/server/src/routes/chat.ts`
  - `GET /api/assistant/sessions` — 按 updatedAt DESC 排序返回所有会话
  - `PATCH /api/assistant/sessions/:id` — 重命名会话标题
  - `DELETE /api/assistant/sessions/:id` — 删除会话
  - `POST /api/chat` close 回调中自动 upsert 会话元数据 (title, model, cwd, cost, message count)
- [x] **前端 API**: `packages/web/src/lib/api.ts`
  - 新增 `patchJson`, `deleteJson` HTTP helpers
  - 新增 `assistantSessions()`, `renameAssistantSession(id, title)`, `deleteAssistantSession(id)`
- [x] **前端 UI**: `packages/web/src/pages/Assistant.tsx`
  - 左侧 240px 会话面板：标题 "CONVERSATIONS" + "+" 新建按钮
  - 会话列表：标题、模型、时间 (formatTimeAgo)、费用、hover 删除按钮
  - 空状态："No conversations yet" 图标 + 文字
  - `activeSessionId` 持久化到 localStorage，刷新页面保留当前会话
  - `messagesMapRef` (Map<string, ChatMessage[]>) 内存缓存每个会话的消息
  - 切换会话时恢复历史消息，resumed 会话显示 "Session resumed" 提示
  - 面板可折叠（PanelLeftClose/PanelLeft 图标切换）
  - TanStack React Query 管理会话列表数据
  - 删除会话后自动切换到新会话或第一个可用会话

### Dependencies
- [x] 新增 `react-markdown` ^10.1.0
- [x] 新增 `remark-gfm` ^4.0.1

---

## Settings 页面完善 (2026-03-09)

对照 Readout 截图，补全了 Settings 页面缺失的 5 个 section。

### 后端: `packages/server/src/routes/settings.ts`
- [x] `GET /api/settings/claude-binary` — 检测 Claude 二进制路径 + 版本号
- [x] `GET /api/settings/export` — 导出全部数据 (settings, sessions, costs, tool_calls) 为 JSON

### 后端: `packages/server/src/db/index.ts`
- [x] 新增 8 个默认设置项 (INSERT OR IGNORE):
  - `default_model` (sonnet), `auto_refresh_enabled` (true), `auto_refresh_interval` (30s)
  - `daily_budget_limit` (0), `monthly_budget_limit` (0), `alert_threshold` (80%)
  - `sidebar_visibility` ({}), `agents_enabled` ({ claude_code: true })

### 前端: `packages/web/src/pages/Settings.tsx` — 完整重写
- [x] **Rescan Workspace** — 带 RefreshCw 图标
- [x] **Scan Directories** — 路径显示 ~ 缩写，Add Directory + Scan for New
- [x] **ShipBox Assistant** (新增) — Claude Code 二进制检测 (路径 + 版本 + 状态灯)，默认模型选择 (Haiku/Sonnet/Opus pill 按钮)
- [x] **General** (扩展) — Auto-refresh 开关 + 间隔秒数，Server Port，Export Data 下载按钮
- [x] **Agents** (新增) — Claude Code (路径 + 启用开关)，Codex (Not installed, disabled)
- [x] **Sidebar** (新增) — Customize Sidebar 按钮展开 2 列 grid，点击切换显示/隐藏，Reset to Default
- [x] **Cost Budget** (新增) — Daily/Monthly $ 输入框，Alert 阈值滑块 (0-100%, 默认 80%)

### 前端: `packages/web/src/components/Sidebar.tsx`
- [x] 读取 `sidebar_visibility` 设置，过滤隐藏的导航项
- [x] 整个 section 的项目都隐藏时不渲染 section header

### 前端组件
- [x] `Toggle` — 可复用开关组件 (disabled 支持)
- [x] `SectionHeader` — 统一 section 标题样式 (图标 + 大写 label)
- [x] `useDebouncedSave` — 防抖保存 hook (数字输入延迟 600ms 写入)
- [x] `BudgetInputs` — 预算输入组件 (daily/monthly + alert slider)
- [x] `SidebarCustomizer` — sidebar 自定义 grid 面板

### API 客户端: `packages/web/src/lib/api.ts`
- [x] 新增 `claudeBinary()`, `exportData()`

---

## Session 即时创建 (2026-03-10)

修复：发送第一条消息时 session 立即出现在侧边栏，而非等响应完成。

### 后端: `packages/server/src/routes/chat.ts`
- [x] 收到 `system.init` 事件时立即 INSERT session 记录到 DB (title = 消息前60字符)
- [x] `child.on("close")` 改为仅 UPDATE (cost, messageCount, updatedAt)

### 前端: `packages/web/src/pages/Assistant.tsx`
- [x] 收到 `system.init` 事件时立即调用 `refetchSessions()` 刷新侧边栏
