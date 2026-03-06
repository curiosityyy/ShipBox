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

  if (isLoading) return <div className="text-[#8b949e]">Loading...</div>;

  const sessionIds = data?.activeSessionIds || [];

  return (
    <div>
      <PageHeader title="Live" count={sessionIds.length} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard value={sessionIds.length} label="Sessions" color="blue" />
        <StatCard value={data?.generating || 0} label="Generating" color="green" />
        <StatCard value="--" label="Memory MB" color="green" />
      </div>

      {sessionIds.length > 0 ? (
        <div className="space-y-2">
          {sessionIds.map((id: string) => (
            <div key={id} className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio size={16} className="text-[#2f81f7]" />
                <span className="font-mono text-sm">Session {id.slice(0, 8)}</span>
              </div>
              <span className="text-xs px-2 py-1 bg-[#3fb950]/20 text-[#3fb950] rounded-full">active</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-[#8b949e] py-10">No active sessions</div>
      )}
    </div>
  );
}
