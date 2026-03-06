import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { Activity, GitBranch } from "lucide-react";
import { clsx } from "clsx";

const statusDot: Record<string, string> = {
  active: "bg-[#34d399] shadow-[0_0_6px_rgba(52,211,153,0.4)]",
  idle: "bg-[#fbbf24] shadow-[0_0_6px_rgba(251,191,36,0.4)]",
  dormant: "bg-[#475569]",
};

const statusText: Record<string, string> = {
  active: "text-[#34d399]",
  idle: "text-[#fbbf24]",
  dormant: "text-[#475569]",
};

function timeAgo(ts: number): string {
  if (!ts) return "never";
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RepoPulse() {
  const { data, isLoading } = useQuery({ queryKey: ["work-graph"], queryFn: api.workGraph });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;
  if (!data) return null;

  const repos = [...(data.repos || [])].sort((a: any, b: any) => {
    const order: Record<string, number> = { active: 0, idle: 1, dormant: 2 };
    const statusDiff = (order[a.status] ?? 2) - (order[b.status] ?? 2);
    if (statusDiff !== 0) return statusDiff;
    return b.commitsToday - a.commitsToday;
  });

  const stats = data.stats || { active: 0, idle: 0, dormant: 0, totalCommits: 0 };

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <PageHeader title="Repo Pulse" count={repos.length} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="animate-fade-up stagger-1">
          <StatCard value={stats.active} label="Active" color="green" />
        </div>
        <div className="animate-fade-up stagger-2">
          <StatCard value={stats.totalCommits} label="Commits Today" color="blue" />
        </div>
        <div className="animate-fade-up stagger-3">
          <StatCard value={repos.filter((r: any) => r.dirty).length} label="Dirty" color="yellow" />
        </div>
      </div>

      {repos.length === 0 ? (
        <EmptyState
          icon={<Activity size={48} />}
          title="No repos found"
          description="Add scan directories in Settings to monitor repository health."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map((repo: any, index: number) => (
            <div
              key={repo.path}
              className={`glass-card animate-fade-up stagger-${Math.min(index + 4, 8)} rounded-xl px-5 py-4 hover:border-[#34d399]/30 transition-colors duration-200`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className={clsx("w-2 h-2 rounded-full", statusDot[repo.status as string])} />
                  <span className="font-display font-semibold text-base text-[#e2e8f0]">
                    {repo.name}
                  </span>
                </div>
                <span className={clsx("font-mono text-xs uppercase", statusText[repo.status as string])}>
                  {repo.status}
                </span>
              </div>

              <div className="space-y-2 ml-[18px]">
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch size={12} className="text-[#64748b]" />
                  <span className="font-mono text-xs text-[#64748b]">{repo.branch}</span>
                  {repo.dirty && (
                    <span className="font-mono text-[10px] uppercase tracking-wider rounded-md px-2 py-0.5 bg-[rgba(251,191,36,0.15)] text-[#fbbf24]">
                      dirty
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#64748b]">
                    Last commit: <span className="text-[#e2e8f0]">{timeAgo(repo.lastCommitAt)}</span>
                  </span>
                  {repo.commitsToday > 0 && (
                    <span className="font-mono text-[#34d399]">
                      {repo.commitsToday} today
                    </span>
                  )}
                </div>

                <div className="font-mono text-[11px] text-[#475569] truncate">{repo.path}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
