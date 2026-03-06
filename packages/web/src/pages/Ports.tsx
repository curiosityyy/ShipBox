import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { Cable } from "lucide-react";

export default function Ports() {
  const { data, isLoading } = useQuery({ queryKey: ["ports"], queryFn: api.ports });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;

  const ports = data?.ports || [];
  const processes = [...new Set(ports.map((p: any) => p.process))] as string[];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Ports" count={ports.length} />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stagger-1">
          <StatCard value={ports.length} label="Ports" color="blue" />
        </div>
        <div className="stagger-2">
          <StatCard value={processes.length} label="Processes" color="green" />
        </div>
        <div className="stagger-3">
          <StatCard
            value={ports.filter((p: any) => p.process === "node").length}
            label="Node"
            color="green"
          />
        </div>
      </div>

      {ports.length === 0 ? (
        <EmptyState
          icon={<Cable size={48} />}
          title="No open ports"
          description="No listening ports detected."
        />
      ) : (
        <div className="space-y-3">
          {processes.map((proc: string, index: number) => {
            const procPorts = ports.filter((p: any) => p.process === proc);
            return (
              <div
                key={proc}
                className={`glass-card animate-fade-up stagger-${Math.min(index + 4, 8)} rounded-xl px-5 py-4`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Cable size={14} className="text-[#64748b]" />
                  <span className="font-mono text-sm font-semibold text-[#e2e8f0]">
                    {proc}
                  </span>
                  <span className="font-mono text-[10px] text-[#475569] bg-[#151a25] rounded-md px-1.5 py-0.5">
                    PID {procPorts[0]?.pid}
                  </span>
                </div>
                <div className="space-y-1.5 ml-[27px]">
                  {procPorts.map((p: any) => (
                    <div key={p.port} className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-[#34d399]">:{p.port}</span>
                      <span className="text-[#475569] font-mono text-xs">127.0.0.1</span>
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
