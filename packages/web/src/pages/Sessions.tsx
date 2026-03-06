import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { Clock, Cpu, Wrench, DollarSign, ChevronDown, ChevronRight, User, Bot } from "lucide-react";

export default function Sessions() {
  const { data, isLoading } = useQuery({ queryKey: ["sessions"], queryFn: api.sessions });
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          {sessions.map((s: any) => {
            const isExpanded = expandedId === s.id;
            return (
              <div key={s.id} className="glass-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#1c2333]/40 transition-colors text-left"
                >
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-[#64748b] shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-[#64748b] shrink-0" />
                  )}

                  {/* Left: summary + project */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#e2e8f0] truncate">
                      {s.summary || "Untitled session"}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#64748b] mt-1">
                      <span className="inline-flex items-center gap-1 bg-[#1e2433] rounded px-1.5 py-0.5 text-[#34d399] text-[10px] font-medium">
                        <Bot size={10} /> Claude Code
                      </span>
                      <span className="text-[#60a5fa]">{s.projectPath?.split("/").pop() || "unknown"}</span>
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
                </button>

                {/* Expanded: show transcript messages */}
                {isExpanded && (
                  <SessionTranscript sessionId={s.id} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SessionTranscript({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["transcripts", sessionId],
    queryFn: () => api.transcripts(),
  });

  const transcripts = data?.transcripts || [];
  const session = transcripts.find((t: any) => t.sessionId === sessionId);
  const messages = session?.messages || [];

  return (
    <div className="border-t border-[#1e293b] px-5 py-4 space-y-3 max-h-[500px] overflow-y-auto">
      {isLoading ? (
        <div className="text-xs text-[#64748b] py-2">Loading transcript...</div>
      ) : messages.length === 0 ? (
        <div className="text-xs text-[#64748b] py-2">No messages found for this session.</div>
      ) : (
        messages.map((msg: any, i: number) => (
          <div key={i} className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              {msg.role === "user" ? (
                <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center">
                  <User size={12} className="text-[#60a5fa]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center">
                  <Bot size={12} className="text-[#34d399]" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-[#475569] mb-0.5">
                {msg.role === "user" ? "You" : msg.model ? formatModel(msg.model) : "Claude"}
              </div>
              <div className="text-sm text-[#c9d1d9] whitespace-pre-wrap break-words leading-relaxed">
                {msg.text}
              </div>
              {msg.toolUse && msg.toolUse.length > 0 && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {msg.toolUse.map((tool: string, ti: number) => (
                    <span
                      key={ti}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#151a25] text-[#64748b]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
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
