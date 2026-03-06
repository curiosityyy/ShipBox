import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Radio } from "lucide-react";

export default function Live() {
  const { data, isLoading } = useQuery({
    queryKey: ["live"],
    queryFn: api.live,
    refetchInterval: 3000,
  });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;

  const sessionIds = data?.activeSessionIds || [];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Live" count={sessionIds.length} />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stagger-1">
          <StatCard value={sessionIds.length} label="Sessions" color="blue" />
        </div>
        <div className="stagger-2">
          <StatCard value={data?.generating || 0} label="Generating" color="green" />
        </div>
        <div className="stagger-3">
          <StatCard value="--" label="Memory MB" color="green" />
        </div>
      </div>

      {sessionIds.length > 0 ? (
        <div className="space-y-3">
          {sessionIds.map((id: string, index: number) => (
            <div
              key={id}
              className={`glass-card animate-fade-up stagger-${Math.min(index + 4, 8)} rounded-xl px-5 py-4 flex items-center justify-between`}
            >
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-[#34d399] animate-pulse-glow" />
                <div>
                  <span className="font-mono text-sm text-[#e2e8f0]">
                    Session {id.slice(0, 8)}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono rounded-md px-2 py-0.5 bg-[rgba(52,211,153,0.15)] text-[#34d399]">
                active
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up stagger-4">
          <div className="w-16 h-16 rounded-full glass-card border border-[#34d399]/15 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(52,211,153,0.06)]">
            <Radio size={24} className="text-[#64748b]" />
          </div>
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">
            No active sessions
          </h3>
          <p className="text-sm text-[#64748b] max-w-sm leading-relaxed">
            Active Claude Code sessions will appear here in real time.
          </p>
        </div>
      )}
    </div>
  );
}
