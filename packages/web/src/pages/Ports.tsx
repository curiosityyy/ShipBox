import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { Cable } from "lucide-react";

export default function Ports() {
  const { data, isLoading } = useQuery({ queryKey: ["ports"], queryFn: api.ports });

  if (isLoading) return <div className="text-[#8b949e]">Loading...</div>;

  const ports = data?.ports || [];
  const processes = [...new Set(ports.map((p: any) => p.process))];

  return (
    <div>
      <PageHeader title="Ports" count={ports.length} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard value={ports.length} label="Ports" color="blue" />
        <StatCard value={processes.length} label="Processes" color="green" />
        <StatCard value={ports.filter((p: any) => p.process === "node").length} label="Node" color="green" />
      </div>

      {ports.length === 0 ? (
        <EmptyState icon={<Cable size={48} />} title="No open ports" description="No listening ports detected." />
      ) : (
        <div className="space-y-2">
          {/* Group by process */}
          {processes.map((proc: string) => {
            const procPorts = ports.filter((p: any) => p.process === proc);
            return (
              <div key={proc} className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-semibold">{proc}</span>
                  <span className="text-xs text-[#8b949e]">PID {procPorts[0]?.pid}</span>
                </div>
                <div className="space-y-1">
                  {procPorts.map((p: any) => (
                    <div key={p.port} className="flex items-center gap-2 text-sm">
                      <span className="text-[#2f81f7] font-mono">:{p.port}</span>
                      <span className="text-[#8b949e]">127.0.0.1</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
