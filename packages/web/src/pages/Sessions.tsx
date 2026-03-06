import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { Clock, Cpu, Wrench, DollarSign } from "lucide-react";

export default function Sessions() {
  const { data, isLoading } = useQuery({ queryKey: ["sessions"], queryFn: api.sessions });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;

  const sessions = data?.sessions || [];
  const totalCost = sessions.reduce((sum: number, s: any) => sum + (s.costUsd || 0), 0);
  const totalTools = sessions.reduce((sum: number, s: any) => sum + (s.toolCallCount || 0), 0);

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <PageHeader title="Sessions" count={data?.total || 0} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="animate-fade-up stagger-1">
          <StatCard value={sessions.length} label="Total Sessions" color="blue" />
        </div>
        <div className="animate-fade-up stagger-2">
          <StatCard
            value={sessions.reduce((sum: number, s: any) => sum + (s.messageCount || 0), 0)}
            label="Messages"
            color="green"
          />
        </div>
        <div className="animate-fade-up stagger-3">
          <StatCard value={totalTools} label="Tool Calls" color="yellow" />
        </div>
        <div className="animate-fade-up stagger-4">
          <StatCard value={`$${totalCost.toFixed(2)}`} label="Total Cost" color="yellow" />
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Clock size={48} />}
          title="No session data"
          description="Session data is collected from agent history and usage logs."
        />
      ) : (
        <div className="space-y-2 animate-fade-up stagger-5">
          {sessions.map((s: any) => (
            <div
              key={s.id}
              className="glass-card rounded-xl px-5 py-4 flex items-center gap-4 hover:border-[#30363d] transition-colors duration-150"
            >
              {/* Left: summary + project */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#e2e8f0] truncate mb-1">
                  {s.summary || "Untitled session"}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#64748b]">
                  <span className="text-[#34d399]">{s.projectPath?.split("/").pop() || "unknown"}</span>
                  <span>{formatTimeAgo(s.startedAt)}</span>
                </div>
              </div>

              {/* Model badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Cpu size={12} className="text-[#64748b]" />
                <span className="text-xs font-mono text-[#64748b]">
                  {formatModel(s.model)}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 shrink-0 text-xs font-mono text-[#64748b]">
                <span className="flex items-center gap-1">
                  <Wrench size={11} />
                  {s.toolCallCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={11} />
                  {s.costUsd?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatModel(model: string): string {
  if (!model) return "unknown";
  return model.replace("claude-", "").replace(/-\d{8}$/, "").replace(/-/g, " ");
}

function formatTimeAgo(ts: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
