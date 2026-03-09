import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { BarChart3, Repeat, FileEdit, Terminal, Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PageSkeleton } from "../components/PageSkeleton";

const barColors = ["#60a5fa", "#fbbf24", "#34d399", "#818cf8", "#fb923c", "#f87171", "#38bdf8", "#a78bfa"];

export default function Tools() {
  const { data, isLoading } = useQuery({ queryKey: ["tools"], queryFn: api.tools });

  if (isLoading) return <PageSkeleton cards={3} />;
  if (!data) return null;

  const toolEntries = Object.entries(data.tools || {}).sort(([, a], [, b]) => (b as number) - (a as number));
  const chainEntries = Object.entries(data.chains || {}).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 8);
  const cmdEntries = Object.entries(data.commands || {}).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 10);
  const fileEntries = Object.entries(data.files || {}).sort(([, a], [, b]) => (b as number) - (a as number));

  const maxTool = toolEntries.length > 0 ? (toolEntries[0][1] as number) : 1;
  const maxChain = chainEntries.length > 0 ? (chainEntries[0][1] as number) : 1;
  const maxCmd = cmdEntries.length > 0 ? (cmdEntries[0][1] as number) : 1;

  // Build usage-over-time chart data from daily breakdown if available
  const dailyData = data.daily || [];
  const totalCalls = data.totalCalls || 0;

  // Find busiest day
  let busiestDay = "";
  let busiestCount = 0;
  for (const d of dailyData) {
    if (d.count > busiestCount) {
      busiestCount = d.count;
      busiestDay = d.date;
    }
  }

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <PageHeader title="Tools" count={totalCalls} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="animate-fade-up stagger-1">
          <StatCard value={totalCalls} label="Total Calls" color="blue" />
        </div>
        <div className="animate-fade-up stagger-2">
          <StatCard value={fileEntries.length} label="Files Touched" color="green" />
        </div>
        <div className="animate-fade-up stagger-3">
          <StatCard value={data.sessionCount ? Math.round(totalCalls / data.sessionCount) : 0} label="Avg/Session" color="yellow" />
        </div>
      </div>

      {/* Usage Over Time */}
      {dailyData.length > 0 && (
        <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-[#60a5fa]" />
            <span className="text-sm font-semibold text-[#e2e8f0]">Usage Over Time</span>
            <span className="text-xs text-[#64748b]">{dailyData.length}d of data</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData}>
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#1e293b" }}
                tickLine={false}
                tickFormatter={(v: string) => v.slice(5)}
              />
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
                itemStyle={{ color: "#60a5fa" }}
                cursor={{ fill: "rgba(96, 165, 250, 0.08)" }}
                formatter={(v: number) => [v, "Calls"]}
              />
              <Bar dataKey="count" fill="#60a5fa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {busiestDay && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#64748b]">
              <Flame size={12} className="text-[#fbbf24]" />
              Busiest: {busiestDay.slice(5)} with {busiestCount} calls
            </div>
          )}
        </section>
      )}

      {/* Tool Distribution */}
      <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 size={14} className="text-[#34d399]" />
          <span className="text-sm font-semibold text-[#e2e8f0]">Tool Distribution</span>
          <span className="text-xs text-[#64748b]">{toolEntries.length} tools</span>
        </div>
        <div className="space-y-3">
          {toolEntries.map(([tool, count], i) => (
            <HBar
              key={tool}
              label={tool}
              value={count as number}
              max={maxTool}
              color={barColors[i % barColors.length]}
            />
          ))}
        </div>
      </section>

      {/* Common Sequences */}
      {chainEntries.length > 0 && (
        <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-6">
          <div className="flex items-center gap-2 mb-5">
            <Repeat size={14} className="text-[#34d399]" />
            <span className="text-sm font-semibold text-[#e2e8f0]">Common Sequences</span>
            <span className="text-xs text-[#64748b]">{chainEntries.length} patterns</span>
          </div>
          <div className="space-y-2">
            {chainEntries.map(([chain, count]) => {
              const parts = chain.split("→").map((p) => p.trim());
              return (
                <div
                  key={chain}
                  className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[#1c2333] transition-colors duration-200"
                >
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#e2e8f0]">
                    {parts.map((part, pi) => (
                      <span key={pi} className="flex items-center gap-1.5">
                        {pi > 0 && (
                          <span className="text-[#34d399] text-sm">&rarr;</span>
                        )}
                        <span>{part}</span>
                      </span>
                    ))}
                  </div>
                  <span className="font-mono text-xs text-[#64748b]">{count as number}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Most Edited Files */}
      {fileEntries.length > 0 && (
        <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-7">
          <div className="flex items-center gap-2 mb-5">
            <FileEdit size={14} className="text-[#fbbf24]" />
            <span className="text-sm font-semibold text-[#e2e8f0]">Most Edited Files</span>
            <span className="text-xs text-[#64748b]">{fileEntries.length} total</span>
          </div>
          <div className="space-y-2">
            {fileEntries.map(([file, count]) => (
              <div
                key={file}
                className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[#1c2333] transition-colors duration-200"
              >
                <span className="font-mono text-xs text-[#c9d1d9] truncate">{file.split("/").pop()}</span>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className="text-[10px] text-[#64748b]">
                    {file.includes("/") ? file.split("/").slice(-2, -1)[0] : ""}
                  </span>
                  <span className="font-mono text-xs text-[#64748b] w-8 text-right">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Commands */}
      {cmdEntries.length > 0 && (
        <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-8">
          <div className="flex items-center gap-2 mb-5">
            <Terminal size={14} className="text-[#fbbf24]" />
            <span className="text-sm font-semibold text-[#e2e8f0]">Top Commands</span>
            <span className="text-xs text-[#64748b]">{cmdEntries.length} commands</span>
          </div>
          <div className="space-y-3">
            {cmdEntries.map(([cmd, count], i) => (
              <HBar
                key={cmd}
                label={cmd}
                value={count as number}
                max={maxCmd}
                color={barColors[i % barColors.length]}
                prefix="$"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HBar({
  label,
  value,
  max,
  color,
  prefix,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  prefix?: string;
}) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs text-[#e2e8f0] w-36 shrink-0 truncate">
        {prefix && <span className="text-[#34d399] mr-1">{prefix}</span>}
        {label}
      </span>
      <div className="flex-1 h-7 bg-[#0f1219] rounded-lg overflow-hidden">
        <div
          className="h-full rounded-lg transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color}80)`,
          }}
        />
      </div>
      <span className="font-mono text-xs text-[#64748b] w-10 text-right">{value}</span>
    </div>
  );
}
