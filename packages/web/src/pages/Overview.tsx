import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { StatCard } from "../components/StatCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Overview() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });

  if (isLoading) return <div className="text-[#8b949e]">Loading...</div>;
  if (!data) return null;

  const costDisplay = data.stats.estCost < 1
    ? `$${data.stats.estCost.toFixed(2)}`
    : `$${data.stats.estCost.toFixed(2)}`;

  return (
    <div>
      {/* Greeting */}
      <h1 className="text-3xl font-bold mb-1">
        {data.greeting}, {data.user}
      </h1>
      <p className="text-[#8b949e] mb-6">
        You have <span className="text-[#e6edf3] font-semibold">{data.stats.repos}</span> repos set up.
        {data.stats.repos === 0 && " Fresh slate today."}
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard value={data.stats.repos} label="Repos" color="blue" />
        <StatCard value={data.stats.commitsToday} label="Commits Today" color="green" />
        <StatCard value={data.stats.sessions} label="Sessions" color="green" />
        <StatCard value={costDisplay} label="Est. Cost" color="yellow" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Activity chart */}
        <div className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold">Activity</span>
            <span className="text-xs text-[#8b949e]">30d</span>
          </div>
          {data.dailyCosts && data.dailyCosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.dailyCosts}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#1c2333", border: "1px solid #30363d", borderRadius: 8 }}
                  labelStyle={{ color: "#8b949e" }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]}
                />
                <Bar dataKey="cost" fill="#2f81f7" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-[#8b949e] text-sm">
              No activity data yet
            </div>
          )}
        </div>

        {/* Cost by Model */}
        <div className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold">Cost by Model</span>
          </div>
          {data.costByModel && Object.keys(data.costByModel).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.costByModel).map(([model, cost]) => (
                <div key={model} className="flex items-center justify-between">
                  <span className="text-sm text-[#8b949e]">{model.replace("claude-", "").replace(/-/g, " ")}</span>
                  <span className="text-sm font-mono">${(cost as number).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-[#8b949e] text-sm">
              No cost data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d] mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-semibold">Recent Sessions</span>
        </div>
        {data.recentSessions && data.recentSessions.length > 0 ? (
          <div className="space-y-3">
            {data.recentSessions.map((s: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2f81f7] mt-2 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm truncate">{s.display}</div>
                  <div className="text-xs text-[#8b949e]">
                    <span className="text-[#2f81f7]">{s.project?.split("/").pop() || "user"}</span>
                    {" · "}
                    {formatTimeAgo(s.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[#8b949e] text-sm py-4 text-center">No recent sessions</div>
        )}
      </div>

      {/* Tool Stats */}
      {data.toolStats && (
        <div className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold">Tool Usage</span>
            <span className="text-xs text-[#8b949e]">{data.toolStats.totalCalls} calls</span>
          </div>
          <div className="space-y-2">
            {Object.entries(data.toolStats.tools)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 7)
              .map(([tool, count]) => {
                const max = Math.max(...Object.values(data.toolStats.tools).map(Number));
                const pct = ((count as number) / max) * 100;
                return (
                  <div key={tool} className="flex items-center gap-3">
                    <span className="text-sm text-[#8b949e] w-32 shrink-0">{tool}</span>
                    <div className="flex-1 h-5 bg-[#0f1117] rounded overflow-hidden">
                      <div
                        className="h-full bg-[#2f81f7] rounded"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-[#8b949e] w-10 text-right">{count as number}</span>
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
