import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { StatCard } from "../components/StatCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, DollarSign, Clock, Wrench } from "lucide-react";

export default function Overview() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;
  if (!data) return null;

  const costDisplay = data.stats.estCost < 1
    ? `$${data.stats.estCost.toFixed(2)}`
    : `$${data.stats.estCost.toFixed(2)}`;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="animate-fade-up">
        <h1 className="font-display text-4xl font-bold text-[#e2e8f0] mb-2">
          {data.greeting}, <span className="text-[#34d399]">{data.user}</span>
        </h1>
        <p className="text-[#64748b] text-lg">
          You have <span className="text-[#e2e8f0] font-semibold">{data.stats.repos}</span> repos set up.
          {data.stats.repos === 0 && " Fresh slate today."}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="animate-fade-up stagger-1">
          <StatCard value={data.stats.repos} label="Repos" color="blue" />
        </div>
        <div className="animate-fade-up stagger-2">
          <StatCard value={data.stats.commitsToday} label="Commits Today" color="green" />
        </div>
        <div className="animate-fade-up stagger-3">
          <StatCard value={data.stats.sessions} label="Sessions" color="green" />
        </div>
        <div className="animate-fade-up stagger-4">
          <StatCard value={costDisplay} label="Est. Cost" color="yellow" />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Activity chart */}
        <div className="glass-card rounded-2xl p-5 animate-fade-up stagger-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={14} className="text-[#34d399]" />
            <span className="text-sm font-semibold text-[#e2e8f0]">Activity</span>
            <span className="text-xs text-[#64748b]">30d</span>
          </div>
          {data.dailyCosts && data.dailyCosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.dailyCosts}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#151a25",
                    border: "1px solid #1e293b",
                    borderRadius: 12,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: "#64748b" }}
                  itemStyle={{ color: "#34d399" }}
                  cursor={{ fill: "rgba(52, 211, 153, 0.08)" }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]}
                />
                <Bar dataKey="cost" fill="#34d399" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-[#64748b] text-sm">
              No activity data yet
            </div>
          )}
        </div>

        {/* Cost by Model */}
        <div className="glass-card rounded-2xl p-5 animate-fade-up stagger-6">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign size={14} className="text-[#fbbf24]" />
            <span className="text-sm font-semibold text-[#e2e8f0]">Cost by Model</span>
          </div>
          {data.costByModel && Object.keys(data.costByModel).length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const entries = Object.entries(data.costByModel);
                const maxCost = Math.max(...entries.map(([, c]) => c as number));
                return entries.map(([model, cost]) => {
                  const pct = maxCost > 0 ? ((cost as number) / maxCost) * 100 : 0;
                  return (
                    <div key={model} className="relative flex items-center justify-between py-1.5 px-2 rounded-lg overflow-hidden">
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: "linear-gradient(90deg, rgba(52,211,153,0.1) 0%, rgba(52,211,153,0.03) 100%)",
                          width: `${pct}%`,
                        }}
                      />
                      <span className="relative text-sm text-[#e2e8f0]">
                        {model.replace("claude-", "").replace(/-/g, " ")}
                      </span>
                      <span className="relative font-mono text-sm text-[#34d399]">
                        ${(cost as number).toFixed(2)}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-[#64748b] text-sm">
              No cost data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="glass-card rounded-2xl p-5 animate-fade-up stagger-7">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={14} className="text-[#60a5fa]" />
          <span className="text-sm font-semibold text-[#e2e8f0]">Recent Sessions</span>
        </div>
        {data.recentSessions && data.recentSessions.length > 0 ? (
          <div className="space-y-1">
            {data.recentSessions.map((s: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 hover:bg-[#1c2333]/60"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#34d399] mt-2 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-[#e2e8f0] truncate">{s.display}</div>
                  <div className="text-xs text-[#64748b]">
                    <span className="text-[#34d399]">{s.project?.split("/").pop() || "user"}</span>
                    {" · "}
                    {formatTimeAgo(s.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[#64748b] text-sm py-4 text-center">No recent sessions</div>
        )}
      </div>

      {/* Tool Stats */}
      {data.toolStats && (
        <div className="glass-card rounded-2xl p-5 animate-fade-up stagger-8">
          <div className="flex items-center gap-2 mb-5">
            <Wrench size={14} className="text-[#c084fc]" />
            <span className="text-sm font-semibold text-[#e2e8f0]">Tool Usage</span>
            <span className="text-xs text-[#64748b]">{data.toolStats.totalCalls} calls</span>
          </div>
          <div className="space-y-3">
            {Object.entries(data.toolStats.tools)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 7)
              .map(([tool, count]) => {
                const max = Math.max(...Object.values(data.toolStats.tools).map(Number));
                const pct = ((count as number) / max) * 100;
                return (
                  <div key={tool} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#64748b] w-32 shrink-0 truncate">{tool}</span>
                    <div className="flex-1 h-6 bg-[#0f1219] rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #34d399, rgba(52,211,153,0.5))",
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-[#64748b] w-10 text-right">{count as number}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
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
