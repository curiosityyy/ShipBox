import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { GitCompare, Bot, ChevronRight, ChevronDown, Play } from "lucide-react";

export default function Diffs() {
  const { data, isLoading } = useQuery({ queryKey: ["diffs"], queryFn: api.diffs });
  const { data: sessionsData } = useQuery({ queryKey: ["sessions"], queryFn: api.sessions });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;
  if (!data) return null;

  const diffs = data.diffs || [];
  const sessions = sessionsData?.sessions || [];
  const totalFiles = diffs.length;
  const totalEdits = diffs.reduce((sum: number, d: any) => sum + (d.additions || 0) + (d.deletions || 0), 0);

  // Build session-attributed diff groups
  // Group diffs by repo, then create "session cards" with session metadata
  const repoGroups: Record<string, any[]> = {};
  for (const diff of diffs) {
    if (!repoGroups[diff.repo]) repoGroups[diff.repo] = [];
    repoGroups[diff.repo].push(diff);
  }

  // Create session-like cards from repo groups, enriched with session data
  const sessionCards: Array<{
    id: string;
    title: string;
    repo: string;
    user: string;
    files: any[];
    fileCount: number;
    editCount: number;
    timestamp: number;
    date: string;
  }> = [];

  for (const [repo, files] of Object.entries(repoGroups)) {
    // Try to match with a session
    const matchedSession = sessions.find((s: any) =>
      s.projectPath && repo.includes(s.projectPath.split("/").pop() || "___none___")
    );

    const editCount = files.reduce((sum: number, f: any) => sum + (f.additions || 0) + (f.deletions || 0), 0);
    const ts = matchedSession?.startedAt || Date.now();

    sessionCards.push({
      id: `${repo}-${ts}`,
      title: matchedSession?.summary || files[0]?.file || "File changes",
      repo: repo.split("/").pop() || repo,
      user: "Users/byli",
      files,
      fileCount: files.length,
      editCount,
      timestamp: ts,
      date: formatDate(ts),
    });
  }

  // Sort by timestamp descending
  sessionCards.sort((a, b) => b.timestamp - a.timestamp);

  // Group by date
  const dateGroups: Record<string, typeof sessionCards> = {};
  for (const card of sessionCards) {
    if (!dateGroups[card.date]) dateGroups[card.date] = [];
    dateGroups[card.date].push(card);
  }

  const subtitle = `${sessionCards.length} session${sessionCards.length !== 1 ? "s" : ""} with file changes. ${totalFiles} file${totalFiles !== 1 ? "s" : ""} modified total.`;

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <PageHeader title="Diffs" count={sessionCards.length} subtitle={subtitle} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="animate-fade-up stagger-1">
          <StatCard value={sessionCards.length} label="Sessions" color="blue" />
        </div>
        <div className="animate-fade-up stagger-2">
          <StatCard value={totalFiles} label="Files Changed" color="green" />
        </div>
      </div>

      {sessionCards.length === 0 ? (
        <EmptyState
          icon={<GitCompare size={48} />}
          title="No diffs found"
          description="No recent file changes detected across your repos."
        />
      ) : (
        <div className="space-y-6 animate-fade-up stagger-3">
          {Object.entries(dateGroups).map(([date, cards]) => (
            <div key={date}>
              <div className="text-xs text-[#64748b] font-medium mb-2 px-1">{date}</div>
              <div className="space-y-2">
                {cards.map((card) => {
                  const isExpanded = expandedId === card.id;
                  return (
                    <div key={card.id} className="glass-card rounded-xl overflow-hidden">
                      <div className="flex items-center">
                        {/* Main clickable area */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : card.id)}
                          className="flex-1 px-5 py-4 flex items-start gap-3 hover:bg-[#1c2333]/40 transition-colors text-left min-w-0"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-[#e2e8f0] truncate mb-1.5">
                              {card.title}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 bg-[#1e2433] rounded px-1.5 py-0.5 text-[#34d399] text-[10px] font-medium">
                                <Bot size={10} /> Claude Code
                              </span>
                              <span className="inline-flex items-center bg-[#1e2433] rounded px-1.5 py-0.5 text-[#60a5fa] text-[10px] font-medium">
                                {card.user}
                              </span>
                              <span className="text-[10px] text-[#64748b]">
                                {card.fileCount} file{card.fileCount !== 1 ? "s" : ""}
                              </span>
                              <span className="inline-flex items-center bg-[#fbbf24]/10 rounded px-1.5 py-0.5 text-[#fbbf24] text-[10px] font-medium">
                                {card.editCount} edit{card.editCount !== 1 ? "s" : ""}
                              </span>
                              <span className="text-[10px] text-[#64748b]">
                                {formatTimeAgo(card.timestamp)}
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Replay button */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : card.id)}
                          className="flex items-center gap-1.5 px-4 py-4 text-[#64748b] hover:text-[#e2e8f0] transition-colors shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronDown size={14} />
                          ) : (
                            <>
                              <Play size={11} />
                              <span className="text-xs">Replay</span>
                              <ChevronRight size={14} />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Expanded file list */}
                      {isExpanded && (
                        <div className="border-t border-[#1e293b] px-5 py-3 space-y-1">
                          {card.files.map((diff: any, i: number) => (
                            <div
                              key={`${diff.file}-${i}`}
                              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#1c2333]/40 transition-colors"
                            >
                              <span className="font-mono text-xs text-[#c9d1d9] truncate flex-1 mr-4">
                                {diff.file}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                {diff.additions > 0 && (
                                  <span className="font-mono text-xs text-[#34d399]">+{diff.additions}</span>
                                )}
                                {diff.deletions > 0 && (
                                  <span className="font-mono text-xs text-[#f87171]">-{diff.deletions}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(ts: number): string {
  const now = new Date();
  const date = new Date(ts);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
