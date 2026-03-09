import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { StatCard } from "../components/StatCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, DollarSign, Clock, ChevronRight, AlertTriangle, Zap, Users, Brain, FolderGit2, Circle } from "lucide-react";
import { PageSkeleton } from "../components/PageSkeleton";

const HOURS = ["12a", "", "", "3a", "", "", "6a", "", "", "9a", "", "", "12p", "", "", "3p", "", "", "6p", "", "", "9p", "", ""];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Overview() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });
  const { data: hygieneData } = useQuery({ queryKey: ["hygiene"], queryFn: api.hygiene });
  const navigate = useNavigate();

  if (isLoading) return <PageSkeleton cards={4} />;
  if (!data) return null;

  const costDisplay = `$${data.stats.estCost.toFixed(2)}`;
  const hygieneIssues = hygieneData?.total || 0;

  // Build heatmap data from recent sessions
  const heatmap = buildHeatmapData(data.recentSessions || []);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-[#e2e8f0] mb-1">
          {data.greeting}, <span className="text-[#34d399]">{data.user}</span>
        </h1>
        <p className="text-sm text-[#64748b]">
          You have <span className="text-[#e2e8f0] font-medium">{data.stats.repos}</span> repos set up.
          {data.stats.repos === 0 && " Fresh slate today."}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3 animate-fade-up stagger-1">
        <StatCard value={data.stats.repos} label="Repos" color="blue" />
        <StatCard value={data.stats.commitsToday} label="Commits Today" color="green" />
        <StatCard value={data.stats.sessions} label="Sessions" color="green" />
        <StatCard value={costDisplay} label="Est. Cost" color="yellow" />
      </div>

      {/* 2x2 grid matching Readout: Activity | When You Work / Cost by Model | Recent Sessions */}
      <div className="grid grid-cols-2 gap-4 animate-fade-up stagger-2">
        {/* Activity chart */}
        <button onClick={() => navigate("/costs")} className="glass-card rounded-xl p-4 text-left hover:border-[#30363d] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={13} className="text-[#34d399]" />
              <span className="text-xs font-semibold text-[#e2e8f0]">Activity</span>
              <span className="text-[10px] text-[#64748b]">30d</span>
            </div>
            <ChevronRight size={13} className="text-[#475569]" />
          </div>
          {data.dailyCosts && data.dailyCosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={data.dailyCosts}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#151a25",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#64748b" }}
                  itemStyle={{ color: "#34d399" }}
                  cursor={{ fill: "rgba(52, 211, 153, 0.08)" }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]}
                />
                <Bar dataKey="cost" fill="#34d399" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[100px] flex items-center justify-center text-[#475569] text-xs">
              No activity data yet
            </div>
          )}
        </button>

        {/* When You Work heatmap */}
        <button onClick={() => navigate("/sessions")} className="glass-card rounded-xl p-4 text-left hover:border-[#30363d] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Circle size={13} className="text-[#34d399] fill-[#34d399]" />
              <span className="text-xs font-semibold text-[#e2e8f0]">When You Work</span>
            </div>
            <ChevronRight size={13} className="text-[#475569]" />
          </div>
          <div className="h-[100px] flex flex-col justify-between">
            <div className="flex-1 flex flex-col gap-[2px]">
              {DAYS.map((day, di) => (
                <div key={day} className="flex gap-[2px] flex-1">
                  {Array.from({ length: 24 }).map((_, hi) => {
                    const intensity = heatmap[di]?.[hi] || 0;
                    return (
                      <div
                        key={hi}
                        className="flex-1 rounded-[2px]"
                        style={{
                          backgroundColor: intensity === 0
                            ? "rgba(30, 41, 59, 0.5)"
                            : `rgba(52, 211, 153, ${Math.min(0.15 + intensity * 0.25, 0.9)})`,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            {/* Hour labels */}
            <div className="flex mt-1.5">
              {HOURS.map((label, i) => (
                <span key={i} className="flex-1 text-center text-[8px] text-[#475569]">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </button>

        {/* Cost by Model */}
        <button onClick={() => navigate("/costs")} className="glass-card rounded-xl p-4 text-left hover:border-[#30363d] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign size={13} className="text-[#fbbf24]" />
              <span className="text-xs font-semibold text-[#e2e8f0]">Cost by Model</span>
            </div>
            <ChevronRight size={13} className="text-[#475569]" />
          </div>
          {data.costByModel && Object.keys(data.costByModel).length > 0 ? (
            <div className="space-y-2">
              {(() => {
                const entries = Object.entries(data.costByModel);
                const maxCost = Math.max(...entries.map(([, c]) => c as number));
                return entries.map(([model, cost]) => {
                  const pct = maxCost > 0 ? ((cost as number) / maxCost) * 100 : 0;
                  return (
                    <div key={model} className="relative flex items-center justify-between py-1 px-2 rounded-md overflow-hidden">
                      <div
                        className="absolute inset-0 rounded-md"
                        style={{
                          background: "linear-gradient(90deg, rgba(52,211,153,0.1) 0%, rgba(52,211,153,0.03) 100%)",
                          width: `${pct}%`,
                        }}
                      />
                      <span className="relative text-xs text-[#e2e8f0]">
                        {model.replace("claude-", "").replace(/-/g, " ")}
                      </span>
                      <span className="relative font-mono text-xs text-[#34d399]">
                        ${(cost as number).toFixed(2)}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="h-[100px] flex items-center justify-center text-[#475569] text-xs">
              No cost data yet
            </div>
          )}
        </button>

        {/* Recent Sessions */}
        <button onClick={() => navigate("/sessions")} className="glass-card rounded-xl p-4 text-left hover:border-[#30363d] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-[#60a5fa]" />
              <span className="text-xs font-semibold text-[#e2e8f0]">Recent Sessions</span>
            </div>
            <ChevronRight size={13} className="text-[#475569]" />
          </div>
          {data.recentSessions && data.recentSessions.length > 0 ? (
            <div className="space-y-0.5">
              {data.recentSessions.slice(0, 4).map((s: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg">
                  <div className="w-1 h-1 rounded-full bg-[#64748b] mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[#e2e8f0] truncate">{s.display}</div>
                    <div className="text-[10px] text-[#64748b]">
                      <span className="text-[#34d399]">{s.project?.split("/").pop() || "user"}</span>
                      {" \u00b7 "}
                      {formatTimeAgo(s.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[#475569] text-xs py-4 text-center">No recent sessions</div>
          )}
        </button>
      </div>

      {/* Hygiene warning banner */}
      {hygieneIssues > 0 && (
        <button
          onClick={() => navigate("/hygiene")}
          className="w-full flex items-center gap-3 glass-card rounded-xl px-4 py-3 hover:border-[#30363d] transition-colors animate-fade-up stagger-3"
        >
          <AlertTriangle size={14} className="text-[#fbbf24] shrink-0" />
          <span className="text-xs text-[#e2e8f0] flex-1 text-left">
            {hygieneIssues} hygiene issue{hygieneIssues !== 1 ? "s" : ""} need attention
          </span>
          <ChevronRight size={13} className="text-[#475569]" />
        </button>
      )}

      {/* Quick access cards */}
      <div className="grid grid-cols-4 gap-3 animate-fade-up stagger-4">
        {[
          { label: "Skills", icon: Zap, path: "/skills", desc: data.toolStats ? `${Object.keys(data.toolStats.tools || {}).length} tools` : "No skills found" },
          { label: "Agents", icon: Users, path: "/agents", desc: "Claude Code" },
          { label: "Memory", icon: Brain, path: "/memory", desc: "View memories" },
          { label: "Repos", icon: FolderGit2, path: "/repos", desc: `${data.stats.repos} repos` },
        ].map((card) => (
          <button
            key={card.label}
            onClick={() => navigate(card.path)}
            className="glass-card rounded-xl p-4 text-left hover:border-[#30363d] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#e2e8f0]">{card.label}</span>
              <ChevronRight size={12} className="text-[#475569]" />
            </div>
            <span className="text-[10px] text-[#64748b]">{card.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function buildHeatmapData(sessions: any[]): number[][] {
  // 7 days x 24 hours grid
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const s of sessions) {
    if (!s.timestamp) continue;
    const date = new Date(s.timestamp);
    const day = (date.getDay() + 6) % 7; // Mon=0, Sun=6
    const hour = date.getHours();
    grid[day][hour] = Math.min(grid[day][hour] + 1, 3);
  }

  return grid;
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
