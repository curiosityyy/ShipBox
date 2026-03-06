import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";

const barColors = ["#2f81f7", "#d29922", "#3fb950", "#8b949e", "#da3633", "#a371f7", "#79c0ff"];

export default function Tools() {
  const { data, isLoading } = useQuery({ queryKey: ["tools"], queryFn: api.tools });

  if (isLoading) return <div className="text-[#8b949e]">Loading...</div>;
  if (!data) return null;

  const toolEntries = Object.entries(data.tools || {}).sort(([, a], [, b]) => (b as number) - (a as number));
  const chainEntries = Object.entries(data.chains || {}).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 8);
  const cmdEntries = Object.entries(data.commands || {}).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 10);
  const fileEntries = Object.entries(data.files || {}).sort(([, a], [, b]) => (b as number) - (a as number));

  const maxTool = toolEntries.length > 0 ? (toolEntries[0][1] as number) : 1;
  const maxChain = chainEntries.length > 0 ? (chainEntries[0][1] as number) : 1;
  const maxCmd = cmdEntries.length > 0 ? (cmdEntries[0][1] as number) : 1;

  return (
    <div>
      <PageHeader title="Tools" count={data.totalCalls} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard value={data.totalCalls || 0} label="Total Calls" color="blue" />
        <StatCard value={fileEntries.length} label="Files Touched" color="green" />
        <StatCard value={data.sessionCount ? Math.round(data.totalCalls / data.sessionCount) : 0} label="Avg/Session" color="yellow" />
      </div>

      {/* Tool Distribution */}
      <section className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d] mb-6">
        <h2 className="text-sm font-semibold mb-4">Tool Distribution <span className="text-[#8b949e] font-normal">{toolEntries.length} tools</span></h2>
        <div className="space-y-2">
          {toolEntries.map(([tool, count], i) => (
            <HBar key={tool} label={tool} value={count as number} max={maxTool} color={barColors[i % barColors.length]} />
          ))}
        </div>
      </section>

      {/* Common Sequences */}
      {chainEntries.length > 0 && (
        <section className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d] mb-6">
          <h2 className="text-sm font-semibold mb-4">Common Sequences <span className="text-[#8b949e] font-normal">{chainEntries.length} patterns</span></h2>
          <div className="space-y-2">
            {chainEntries.map(([chain, count]) => (
              <HBar key={chain} label={chain.replace("→", " → ")} value={count as number} max={maxChain} color="#3fb950" />
            ))}
          </div>
        </section>
      )}

      {/* Most Edited Files */}
      {fileEntries.length > 0 && (
        <section className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d] mb-6">
          <h2 className="text-sm font-semibold mb-4">Most Edited Files <span className="text-[#8b949e] font-normal">{fileEntries.length} total</span></h2>
          <div className="space-y-2">
            {fileEntries.map(([file, count]) => (
              <div key={file} className="flex items-center justify-between text-sm">
                <span className="font-mono text-[#8b949e] truncate">{file}</span>
                <span className="ml-4 shrink-0">{count as number}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Commands */}
      {cmdEntries.length > 0 && (
        <section className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d]">
          <h2 className="text-sm font-semibold mb-4">Top Commands <span className="text-[#8b949e] font-normal">{cmdEntries.length} commands</span></h2>
          <div className="space-y-2">
            {cmdEntries.map(([cmd, count], i) => (
              <HBar key={cmd} label={cmd} value={count as number} max={maxCmd} color={i === 0 ? "#2f81f7" : i === 1 ? "#d29922" : "#3fb950"} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#8b949e] w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-5 bg-[#0f1117] rounded overflow-hidden">
        <div className="h-full rounded" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm text-[#8b949e] w-10 text-right">{value}</span>
    </div>
  );
}
