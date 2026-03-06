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
import Setup from "./pages/Setup";
import Assistant from "./pages/Assistant";
import WorkGraph from "./pages/WorkGraph";
import RepoPulse from "./pages/RepoPulse";
import Timeline from "./pages/Timeline";
import Diffs from "./pages/Diffs";
import Snapshots from "./pages/Snapshots";
import Skills from "./pages/Skills";
import Agents from "./pages/Agents";
import Memory from "./pages/Memory";
import Hooks from "./pages/Hooks";
import Hygiene from "./pages/Hygiene";
import Dependencies from "./pages/Dependencies";
import Worktrees from "./pages/Worktrees";
import Env from "./pages/Env";
import Lint from "./pages/Lint";

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="assistant" element={<Assistant />} />

        {/* Monitor */}
        <Route path="live" element={<Live />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="transcripts" element={<Transcripts />} />
        <Route path="tools" element={<Tools />} />
        <Route path="costs" element={<Costs />} />
        <Route path="setup" element={<Setup />} />
        <Route path="ports" element={<Ports />} />

        {/* Workspace */}
        <Route path="repos" element={<Repos />} />
        <Route path="work-graph" element={<WorkGraph />} />
        <Route path="repo-pulse" element={<RepoPulse />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="diffs" element={<Diffs />} />
        <Route path="snapshots" element={<Snapshots />} />

        {/* Config */}
        <Route path="skills" element={<Skills />} />
        <Route path="agents" element={<Agents />} />
        <Route path="memory" element={<Memory />} />
        <Route path="hooks" element={<Hooks />} />

        {/* Health */}
        <Route path="hygiene" element={<Hygiene />} />
        <Route path="deps" element={<Dependencies />} />
        <Route path="worktrees" element={<Worktrees />} />
        <Route path="env" element={<Env />} />
        <Route path="lint" element={<Lint />} />

        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
