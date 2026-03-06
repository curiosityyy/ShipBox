import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import Overview from "./pages/Overview";
import Settings from "./pages/Settings";
import Tools from "./pages/Tools";
import Repos from "./pages/Repos";
import Live from "./pages/Live";
import Sessions from "./pages/Sessions";
import Transcripts from "./pages/Transcripts";
import Costs from "./pages/Costs";
import Ports from "./pages/Ports";
import { StubPage } from "./pages/StubPage";
import {
  MessageSquare, Server,
  BarChart3, Activity, CalendarDays, GitCompare, Camera,
  Zap, Users, Brain, Link2,
  ShieldCheck, Package, GitBranch, Key, FileCode,
} from "lucide-react";

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="assistant" element={<StubPage title="Assistant" icon={<MessageSquare size={48} />} description="Built-in AI chatbot. Add an API key to start chatting." />} />

        {/* Monitor */}
        <Route path="live" element={<Live />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="transcripts" element={<Transcripts />} />
        <Route path="tools" element={<Tools />} />
        <Route path="costs" element={<Costs />} />
        <Route path="setup" element={<StubPage title="Setup" icon={<Server size={48} />} description="MCP servers, hooks, and plugins are configured in agent settings files." count={0} />} />
        <Route path="ports" element={<Ports />} />

        {/* Workspace */}
        <Route path="repos" element={<Repos />} />
        <Route path="work-graph" element={<StubPage title="Work Graph" icon={<BarChart3 size={48} />} description="Repository activity visualization." count={0} />} />
        <Route path="repo-pulse" element={<StubPage title="Repo Pulse" icon={<Activity size={48} />} description="Repository health and activity monitoring." count={0} />} />
        <Route path="timeline" element={<StubPage title="Git Timeline" icon={<CalendarDays size={48} />} description="Add repo directories in Settings to see git timelines." count={0} />} />
        <Route path="diffs" element={<StubPage title="Diffs" icon={<GitCompare size={48} />} description="View file changes from Claude Code sessions." count={0} />} />
        <Route path="snapshots" element={<StubPage title="Snapshots" icon={<Camera size={48} />} description="Save and restore git branch snapshots." count={0} />} />

        {/* Config */}
        <Route path="skills" element={<StubPage title="Skills" icon={<Zap size={48} />} description="Skills live in ~/.claude/skills/ or in each repo's .claude/skills/ folder." count={0} />} />
        <Route path="agents" element={<StubPage title="Agents" icon={<Users size={48} />} description="Agents live in each repo's .claude/agents/ folder as .md files." count={0} />} />
        <Route path="memory" element={<StubPage title="Memory" icon={<Brain size={48} />} description="Claude saves memories in MEMORY.md as you work together." count={0} />} />
        <Route path="hooks" element={<StubPage title="Hooks" icon={<Link2 size={48} />} description='Hooks are defined in ~/.claude/settings.json under the "hooks" key.' count={0} />} />

        {/* Health */}
        <Route path="hygiene" element={<StubPage title="Hygiene" icon={<ShieldCheck size={48} />} description="System health checks and zombie process detection." />} />
        <Route path="deps" element={<StubPage title="Dependencies" icon={<Package size={48} />} description="Dependency health checks repos with a package.json." count={0} />} />
        <Route path="worktrees" element={<StubPage title="Worktrees" icon={<GitBranch size={48} />} description="Only repos with multiple worktrees are shown here." count={0} />} />
        <Route path="env" element={<StubPage title="Env" icon={<Key size={48} />} description="Detects .env files across your repos." count={0} />} />
        <Route path="lint" element={<StubPage title="Lint" icon={<FileCode size={48} />} description="Finds CLAUDE.md files in repos or global config." count={0} />} />

        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
