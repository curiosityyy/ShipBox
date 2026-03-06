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
    <aside className="w-[220px] min-w-[220px] bg-[#161b22] border-r border-[#30363d] flex flex-col h-screen overflow-hidden">
      <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-2">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="text-xs font-medium text-[#8b949e] uppercase tracking-wider px-2 mb-1.5">
              {section.label}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-[#2f81f7]/15 text-[#e6edf3] border-l-2 border-[#2f81f7] -ml-[2px] pl-[calc(0.625rem+2px)]"
                      : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2333]"
                  )
                }
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-[#30363d] p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
              isActive
                ? "bg-[#2f81f7]/15 text-[#e6edf3]"
                : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2333]"
            )
          }
        >
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
