import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";

const barColors = ["#34d399", "#fbbf24", "#818cf8", "#fb923c", "#f87171", "#38bdf8", "#a78bfa"];

export default function Tools() {
  const { data, isLoading } = useQuery({ queryKey: ["tools"], queryFn: api.tools });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;
  if (!data) return null;

  const toolEntries = Object.entries(data.tools || {}).sort(([, a], [, b]) => (b as number) - (a as number));
  const chainEntries = Object.entries(data.chains || {}).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 8);
  const cmdEntries = Object.entries(data.commands || {}).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 10);
  const fileEntries = Object.entries(data.files || {}).sort(([, a], [, b]) => (b as number) - (a as number));

  const maxTool = toolEntries.length > 0 ? (toolEntries[0][1] as number) : 1;
  const maxChain = chainEntries.length > 0 ? (chainEntries[0][1] as number) : 1;
  const maxCmd = cmdEntries.length > 0 ? (cmdEntries[0][1] as number) : 1;

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <PageHeader title="Tools" count={data.totalCalls} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="animate-fade-up stagger-1">
          <StatCard value={data.totalCalls || 0} label="Total Calls" color="blue" />
        </div>
        <div className="animate-fade-up stagger-2">
          <StatCard value={fileEntries.length} label="Files Touched" color="green" />
        </div>
        <div className="animate-fade-up stagger-3">
          <StatCard value={data.sessionCount ? Math.round(data.totalCalls / data.sessionCount) : 0} label="Avg/Session" color="yellow" />
        </div>
      </div>

      {/* Tool Distribution */}
      <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-4">
        <h2 className="font-display text-sm font-semibold text-[#e2e8f0] mb-5">
          Tool Distribution{" "}
          <span className="text-[#64748b] font-normal">{toolEntries.length} tools</span>
        </h2>
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
        <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-5">
          <h2 className="font-display text-sm font-semibold text-[#e2e8f0] mb-5">
            Common Sequences{" "}
            <span className="text-[#64748b] font-normal">{chainEntries.length} patterns</span>
          </h2>
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
        <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-6">
          <h2 className="font-display text-sm font-semibold text-[#e2e8f0] mb-5">
            Most Edited Files{" "}
            <span className="text-[#64748b] font-normal">{fileEntries.length} total</span>
          </h2>
          <div className="space-y-2">
            {fileEntries.map(([file, count]) => (
              <div
                key={file}
                className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[#1c2333] transition-colors duration-200"
              >
                <span className="font-mono text-xs text-[#64748b] truncate">{file}</span>
                <span className="ml-4 shrink-0 bg-[#34d399]/10 text-[#34d399] font-mono text-xs rounded-md px-2 py-0.5">
                  {count as number}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Commands */}
      {cmdEntries.length > 0 && (
        <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-7">
          <h2 className="font-display text-sm font-semibold text-[#e2e8f0] mb-5">
            Top Commands{" "}
            <span className="text-[#64748b] font-normal">{cmdEntries.length} commands</span>
          </h2>
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
      <span className="font-mono text-xs text-[#64748b] w-36 shrink-0 truncate">
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
