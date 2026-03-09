import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import {
  LayoutDashboard, MessageSquare,
  Radio, Clock, FileText, Wrench, DollarSign, Server, Cable,
  FolderGit2, BarChart3, Activity, CalendarDays, GitCompare, Camera,
  Zap, Users, Brain, Link2,
  ShieldCheck, Package, GitBranch, Key, FileCode,
  Settings,
} from "lucide-react";

const sections = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "ShipBox" },
      { to: "/assistant", icon: MessageSquare, label: "Assistant" },
    ],
  },
  {
    label: "Monitor",
    items: [
      { to: "/live", icon: Radio, label: "Live" },
      { to: "/sessions", icon: Clock, label: "Sessions" },
      { to: "/transcripts", icon: FileText, label: "Transcripts" },
      { to: "/tools", icon: Wrench, label: "Tools" },
      { to: "/costs", icon: DollarSign, label: "Costs" },
      { to: "/setup", icon: Server, label: "Setup" },
      { to: "/ports", icon: Cable, label: "Ports" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/repos", icon: FolderGit2, label: "Repos" },
      { to: "/work-graph", icon: BarChart3, label: "Work Graph" },
      { to: "/repo-pulse", icon: Activity, label: "Repo Pulse" },
      { to: "/timeline", icon: CalendarDays, label: "Timeline" },
      { to: "/diffs", icon: GitCompare, label: "Diffs" },
      { to: "/snapshots", icon: Camera, label: "Snapshots" },
    ],
  },
  {
    label: "Config",
    items: [
      { to: "/skills", icon: Zap, label: "Skills" },
      { to: "/agents", icon: Users, label: "Agents" },
      { to: "/memory", icon: Brain, label: "Memory" },
      { to: "/hooks", icon: Link2, label: "Hooks" },
    ],
  },
  {
    label: "Health",
    items: [
      { to: "/hygiene", icon: ShieldCheck, label: "Hygiene" },
      { to: "/deps", icon: Package, label: "Deps" },
      { to: "/worktrees", icon: GitBranch, label: "Worktrees" },
      { to: "/env", icon: Key, label: "Env" },
      { to: "/lint", icon: FileCode, label: "Lint" },
    ],
  },
];

export function Sidebar() {
  return (
    <aside
      className="w-[240px] min-w-[240px] flex flex-col h-screen overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0c0f18 0%, #0a0d14 100%)" }}
    >
      {/* Brand mark */}
      <div className="px-5 pt-6 pb-4">
        <div className="leading-none select-none flex items-center gap-1">
          <span className="text-[13px] font-bold tracking-[0.12em] text-[#e2e8f0]">
            SHIPBOX
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] inline-block shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            <div className="text-[11px] font-medium text-[#6b7280] uppercase tracking-[0.08em] px-3 mb-1.5">
              {section.label}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] font-semibold transition-all duration-150 relative",
                    isActive
                      ? "bg-[#1e2433] text-[#e2e8f0] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-4 before:rounded-r-full before:bg-[#60a5fa]"
                      : "text-[#8b949e] hover:text-[#e2e8f0] hover:bg-[#151a25]"
                  )
                }
              >
                <item.icon size={15} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Settings - separated by accent gradient line */}
      <div className="px-3 pb-2">
        <div className="h-px mb-2 mx-2 bg-[#1e293b]" />
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] font-semibold transition-all duration-150 relative",
              isActive
                ? "bg-[#1e2433] text-[#e2e8f0] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-4 before:rounded-r-full before:bg-[#60a5fa]"
                : "text-[#8b949e] hover:text-[#e2e8f0] hover:bg-[#151a25]"
            )
          }
        >
          <Settings size={15} strokeWidth={1.8} />
          <span>Settings</span>
        </NavLink>
      </div>

      {/* Version */}
      <div className="px-5 pb-4 pt-1">
        <span className="text-[10px] text-[#475569]/60 font-mono">v0.1.0</span>
      </div>
    </aside>
  );
}
